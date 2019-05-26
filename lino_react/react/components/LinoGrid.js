import React, {Component} from "react";
import PropTypes from "prop-types";

import queryString from 'query-string';
import key from "weak-key";
import {fetch as fetchPolyfill} from 'whatwg-fetch' // fills fetch

import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {Paginator} from 'primereact/paginator';
import {Button} from 'primereact/button';
import {InputText} from 'primereact/inputtext';
import {Dropdown} from 'primereact/dropdown';

import {Dialog} from 'primereact/dialog';

import {debounce, pvObj2array, find_cellIndex} from "./LinoUtils";

import LinoComponents from "./LinoComponents";
import LinoBbar from "./LinoBbar";


export class LinoGrid extends Component {

    static propTypes = {
        inDetail: PropTypes.bool,
        match: PropTypes.object,
        actorId: PropTypes.string, // AllTickets
        packId: PropTypes.string,  // tickets
        actorData: PropTypes.object,
        mt: PropTypes.int,
        mk: PropTypes.string, // we want to allow str / slug pks
        reload_timestamp: PropTypes.int, // used to propogate a reload

        // todo: in_detail : PropTypes.bool
    };

    static defaultProps = {
        inDetail: false,
    };

    get_full_id() {
        return `${this.props.packId}.${this.props.actorId}`
    }

    constructor(props) {
        super(props);
        let search = queryString.parse(this.props.match.history.location.search);
        let page_key = `${this.props.inDetail ? this.get_full_id() + "." : ""}page`;
        this.state = {
            data: null,
            rows: [],
            show_columns: {}, // Used to override hidden value for columns
            // for pager
            totalRecords: 0,
            rowsPerPage: props.actorData.preview_limit,
            page: search[page_key] ? search[page_key] - 1 : 0,
            topRow: 0,
            // todo pvs: paramValues: [],
            query: "",
            selectedRows: [],
            title: "", // defaults to actor label?
            loading: true,

            pv_values: {},
            editingCellIndex: undefined,
            editingPK: undefined,
            editingValues: {},

        };
        this.reload = debounce(this.reload.bind(this), 200);
        this.refresh = this.reload;
//        this.log = debounce(this.log.bind(this), 200);
        this.onRowSelect = this.onRowSelect.bind(this);
        this.onRowDoubleClick = this.onRowDoubleClick.bind(this);
        this.columnTemplate = this.columnTemplate.bind(this);
        this.expand = this.expand.bind(this);
        this.quickFilter = this.quickFilter.bind(this);
        this.showParamValueDialog = this.showParamValueDialog.bind(this);
        this.update_pv_values = this.update_pv_values.bind(this);
        this.update_url_values = this.update_url_values.bind(this);
        this.update_col_value = this.update_col_value.bind(this);
        this.get_full_id = this.get_full_id.bind(this);
        this.get_cols = this.get_cols.bind(this);
        this.handelKeydown = this.handelKeydown.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onEditorOpen = this.onEditorOpen.bind(this);

    }

    /**
     * Template function generator for grid data.
     * Looks up the correct template and passes in correct data.
     * @param col : json Lino site data, the col value.
     */
    columnTemplate(col) {
        // console.log(col);
        let Template = LinoComponents._GetComponent(col.react_name);
        return (rowData, column) => {
            let pk = rowData[this.props.actorData.pk_index];
            let cellIndex = column.cellIndex;
            let {editingCellIndex, editingPK} = this.state;
            let editing = pk == editingPK && cellIndex == editingCellIndex;

            const prop_bundle = {
                actorId: this.get_full_id(),
                data: rowData,
                disabled_fields: this.state.disabled_fields,
                update_value: this.update_col_value, // No editable yet
                editing_mode: editing,
                hide_label: true,
                in_grid: true,
                column: column,
                match: this.props.match
            };
            prop_bundle.prop_bundle = prop_bundle;
            return <Template {...prop_bundle} elem={col}/>;
        }
    }

    /**
     * Editor function generator for grid data.
     * Looks up the correct template and passes in correct data.
     * @param col : json Lino site data, the col value.
     */
    columnEditor(col) {
        // console.log(col);
        if (!col.editable) return undefined;
        let Editor = LinoComponents._GetComponent(col.react_name);
        return (column) => {
            const prop_bundle = {
                actorId: this.get_full_id(),
                data: this.state.editingValues,
                disabled_fields: this.state.disabled_fields,
                update_value: this.update_col_value,
                hide_label: true,
                in_grid: true,
                column: column,
                editing_mode: true,
                match: this.props.match
            };
            prop_bundle.prop_bundle = prop_bundle;
            return <Editor {...prop_bundle} elem={col}/>;
        }
    }

    onCancel(cellProps) {
        console.log("onCancel");
    }

    onSubmit(cellProps) {
        let {rowData, field, rowIndex} = cellProps;
        // check if new row
        // save row index
        // run ajax call on this.get_full_id url
        // Objects.assign over this.state.rows[rowIndex]
        console.log("onSubmit", cellProps, this.state.editingValues);
        if (!this.editorDirty) {
            return
        }
        window.App.runAction({
            rp: this,
            an: "grid_put",
            actorId: `${this.props.packId}.${this.props.actorId}`,
            sr: this.state.editingPK,
            responce_callback: (data) => {
                // this.setState({editing_mode: false});
                // this.consume_server_responce(data.data_record);
                data.rows && this.setState((old) => { // update just the row
                    let rows = old.rows.slice(); // make data copy
                    rows[rowIndex] = data.rows[0];
                    return {rows: rows}
                })
            }
        })
    }

    onEditorOpen(cellProps) {
        let {rowData, field} = cellProps;
        console.log("editor Open");
        setTimeout(() => {
            this.editorDirty = false;
            this.setState({
                // editingCellIndex:cellIndex,
                editingPK: rowData[this.props.actorData.pk_index], // used when getting return data from row save, in that case, we set new data as editingValues
                editingValues: Object.assign({}, {...rowData}) // made copy of all row data
            })},
            10  )
    }

    update_col_value(v, elem, col) { // on change method for cell editing.
        this.editorDirty = true;
        this.setState((state => {
            // Object.assign(state.rows[col.rowIndex],{...v});
            return {
                // rows:state.rows,
                editingValues: Object.assign({}, {...v})
            }
        }));
        // if (Object.keys(v).length > 1) {
        //     setTimeout(() => document.body.click(), 100);
        // }
        console.log(v);
    }

    expand(e) {
        let status = {base_params: {}};

        if (this.props.actorData.slave) {
            this.props.mt && (status.base_params.mt = this.props.mt);
            this.props.mk && (status.base_params.mk = this.props.mk);
        }

        window.App.runAction({
            an: "grid",
            actorId: `${this.props.packId}.${this.props.actorId}`,
            rp: null,
            status: status
        })

    }


    /**
     *
     * Row selection event on grid, either selects the row or opens a detail action.
     *
     * @param originalEvent
     * @param d
     * @param type ``"radio" | "checkbox" | "row"` ``
     */
    onRowSelect({originalEvent, data, type}) {
        // console.log("onRowSelect", originalEvent, data, type);
        // let cellIndex = find_cellIndex(originalEvent.target);
        // First thing is to determine which cell was selected, as opposed to row.
        originalEvent.stopPropagation(); // Prevents multiple fires when selecting checkbox.

        if (type === "checkbox" || type === "radio") {
            return // We only want selection, no nav.
        }
    }

    onRowDoubleClick({originalEvent, data, type}) {
        let pk = data[this.props.actorData.pk_index];
        // todo check orginalEvent.target to see if it's in an editing cell. if so return
        if (pk != undefined) {
            let status = {
                record_id: pk,
                base_params: {}
            };

            if (this.props.actorData.slave) {

                this.props.mt && (status.base_params.mt = this.props.mt);
                this.props.mk && (status.base_params.mk = this.props.mk);
            }

            window.App.runAction({
                an: this.props.actorData.detail_action,
                actorId: `${this.props.packId}.${this.props.actorId}`,
                rp: this,
                status: status
            });
            // this.props.match.history.push(`/api/${this.props.packId}/${this.props.actorId}/${pk}`);
        }
        // console.log(data);
    }

    /**
     * Opens PV dialog for filtering rows server-side
     */
    showParamValueDialog(e) {
        this.setState({showPVDialog: true})
    }

    quickFilter(query) {
        // in own method so we can use it as a debouce
        this.setState({query: query});
        this.reload({query: query});
//        this.log(query);
    }

    update_url_values(vals, router) {
        let search = queryString.parse(router.history.location.search);
        Object.assign(search, {...vals});
        router.history.replace({search: queryString.stringify(search)});
    }

    reload({page = undefined, query = undefined, pv = undefined} = {}) {
        let state = {
            // data: null,
            // rows: [],
            loading: true,
        };
        query !== undefined && (state.query = query); // update state if query passed to method // QuickSearch string

        // Allow setting of page via reload method params, (requried for paginator)
        if (page !== undefined) {
            state.page = page;
        }
        else {
            page = this.state.page;
        }

        this.update_url_values({[`${this.props.inDetail ? this.get_full_id() + "." : ""}page`]: page + 1}, this.props.match);

        this.setState(state);
        let ajax_query = {
            fmt: "json",
            limit: this.state.rowsPerPage,
            start: page * this.state.rowsPerPage, // Needed due to race condition when setting-state
            query: query !== undefined ? query : this.state.query, // use given query or state-query
            rp: this.rp
        };

        if (this.props.actorData.pv_layout) {
            let search = queryString.parse(this.props.match.history.location.search);
            // use either, pv passed with reload method, current state, or failing all, in url
            if (pv === undefined && Object.keys(this.state.pv_values).length === 0) {
                ajax_query.pv = search.pv
            }
            else {
                ajax_query.pv = pvObj2array(pv || this.state.pv_values, this.props.actorData.pv_fields);
            }
            // convert pv values from obj to array and add to ajax call

        }

        if (this.props.actorData.slave) {
            this.props.mk && (ajax_query.mk = this.props.mk);
            this.props.mt && (ajax_query.mt = this.props.mt);
        }
        // console.log("table pre-GET", ajax_query, this.state);

        fetchPolyfill(`/api/${this.props.packId}/${this.props.actorId}?${queryString.stringify(ajax_query)}`).then(
            window.App.handleAjaxResponse
        ).then(
            (data) => {
                if (!data.success) {
                    // failed for some reason.
                    this.setState({
                        loading: false,
                        data: null,
                        rows: [],
                        show_columns: {}, // Used to override hidden value for columns
                        // for pager
                        totalRecords: 0,
                    });
                    return
                }
                // console.log("table GET", data);
                let rows = data.rows;
                delete data.rows;
                let pv_values = data.param_values;
                delete data.param_values;

                this.setState((prevState) => {
                    let state = {
                        data: data,
                        rows: rows,
                        totalRecords: data.count,
                        topRow: (page) * this.state.rowsPerPage,
                        loading: false,
                        title: data.title,
                        // page: page
                    };
                    // condition because we only want to use default PV values inside of detail views.
                    if (!this.props.inDetail) state.pv_values = pv_values; // This might cause race conditions with editing may PV's quickly.
                    return state;
                });
            }
        ).catch(error => window.App.handleAjaxException(error));
    }

    componentDidUpdate(prevProps) {
        // console.log("Detail compDidUpdate")
        if (this.props.pk !== prevProps.pk ||
            this.props.mk !== prevProps.mk ||
            this.props.mt !== prevProps.mt ||
            (prevProps.reload_timestamp !== 0 && this.props.reload_timestamp !== prevProps.reload_timestamp)
        ) {
            console.log("Reload from DidUpdate method")

            this.reload();
        }
    }

    componentDidMount() {
        // console.log("Reload from DidUpdate method")
        this.cols = undefined;
        document.addEventListener("keydown", this.handelKeydown, false);
        this.reload();
        // console.log(this.props.actorId, "LinoGrid ComponentMount", this.props);
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.handelKeydown, false);
    }

    handelKeydown(event) {
        // switch (event.key) {
        //     case "Escape":
        //         // cancel editing, close editor and clear editing values.
        //         // this.dataTable.closeEditingCell(); // Doesn't exist in local version,
        //         document.body.click(); // What closeEditingCell actually does.
        //         this.setState({editingValues: {}});
        //         break;
        //     case "Enter":
        //         if (Object.keys(this.state.editingValues).length){
        //             console.log("submittion")
        //         };
        //
        // }
    }

    update_pv_values(values) {
        // console.log(v);
        this.setState((prevState) => {
            let old_pv_values = pvObj2array(prevState.pv_values, this.props.actorData.pv_fields);
            let updated_pv = Object.assign(prevState.pv_values, {...values});
            let updated_array_pv = pvObj2array(updated_pv, this.props.actorData.pv_fields);

            if (queryString.stringify(old_pv_values) !== queryString.stringify(updated_array_pv)) {
                // There's a change in the hidden values of PV's

                // Update url query params
                let search = queryString.parse(this.props.match.history.location.search);
                search.pv = updated_array_pv;
                this.props.match.history.replace({search: queryString.stringify(search)});


                this.reload();
                return {pv_values: updated_pv};
            }
        });
    }

    /**
     * An attempt at cacheing the column data to improve performance during re-rending when editing a cell.
     * Unclear how much faster it is.
     * @returns {JSX columns for PR's DataTable}
     */
    get_cols() {

        if (this.cols === undefined) this.cols = ["SelectCol"].concat(this.props.actorData.col.filter((col) => !col.hidden || this.state.show_columns[col.name])).map((col, i) => (
                col === "SelectCol" ? <Column selectionMode="multiple"
                                              style={{
                                                  width: '2em',
                                                  "padding": "unset",
                                                  "text-align": "center"
                                              }}
                        // editor={this.columnEditor(col)}

                    /> :
                    <Column cellIndex={i}
                            field={String(col.fields_index)}
                            body={this.columnTemplate(col)}
                            editor={this.columnEditor(col)}
                            header={col.label}
                            key={key(col)}
                            col={col}
                            style={{width: `${col.width || col.preferred_width}ch`}}
                            className={`l-grid-col-${col.name} ${
                                this.state.editingCellIndex === i ? 'p-cell-editing' : ''
                            }`}
                            onEditorCancel={this.onCancel}
                            onEditorSubmit={this.onSubmit}
                            onEditorOpen={this.onEditorOpen}
                            // validaterEvent={"blur"}
                            isDisabled={
                                (props) => (props.rowData[props.rowData.length-1] ||
                                    (props.rowData[props.rowData.length-2] !== null
                                        && //if null / phantom row / not disabled
                                     Object.keys(props.rowData[props.rowData.length-2]).find(
                                         (e) => e === props.col.name
                                     )
                                    ))
                            }
                        // editorValidator={() => {console.log("validate");
                        //                         return false}}
                    />
            )
        )
        return this.cols
    }

    render() {
        const {rows} = this.state;
        // const Comp = "Table";
        // return loaded ? this.props.render(data, Comp) : <p>{placeholder}</p>;

        const paginator = <Paginator
            rows={this.state.rowsPerPage}
            paginator={true}
            first={this.state.topRow}
            totalRecords={this.state.totalRecords}
            /*paginatorLeft={paginatorLeft} paginatorRight={paginatorRight}
            rowsPerPageOptions={[5, 10, 20]}*/
            onPageChange={(e) => {
                /*Can't be set via set-state, as we need to
                  do an ajax call to change the data not state*/
                this.reload({page: e.page});

            }}/>;
        const header = <div className="p-clearfix p-grid"
            // style={{'lineHeight': '1.87em'}}
        >
            <div className={"p-col p-justify-end"} style={{"text-align": "left"}}>
                {!this.props.inDetail && <React.Fragment>
                    <InputText className="l-grid-quickfilter"
                               placeholder="QuickSearch" /*value={this.state.query}*/
                               onChange={(e) => this.quickFilter(e.target.value)}/>

                    {this.props.actorData.pv_layout && <React.Fragment>
                        <Button icon={"pi pi-filter"} onClick={this.showParamValueDialog}/>
                        <Button icon={"pi pi-times-circle"} onClick={() => this.reload({pv: {}})}/>
                    </React.Fragment>
                    }
                </React.Fragment>}


            </div>
            <div className={"p-col p-justify-center"}><span
                className="l-grid-header">{this.state.title || this.props.actorData.label}</span></div>

            <div className={"p-col p-justify-end"}>{this.props.inDetail &&
            <Button className="l-button-expand-grid p-button-secondary" onClick={this.expand}
                    icon="pi pi-external-link"
                    style={{'float': 'right'}}/>}</div>
            {!this.props.inDetail && <div className={"p-col-12"} style={{"text-align": "left"}}>

                <LinoBbar actorData={this.props.actorData} sr={this.state.selectedRows} reload={this.reload}
                          srMap={(row) => row[this.props.actorData.pk_index]}
                          rp={this} an={'grid'}
                          runAction={this.runAction}/>
            </div>}
        </div>;
        let MainPVComp,
            prop_bundle;

        if (this.props.actorData.pv_layout && this.state.showPVDialog) {
            MainPVComp = LinoComponents._GetComponent(this.props.actorData.pv_layout.main.react_name);
            prop_bundle = {
                data: this.state.pv_values,
                actorId: `${this.props.packId}.${this.props.actorId}`,
                // disabled_fields: this.state.disabled_fields,
                update_value: this.update_pv_values,
                editing_mode: true, // keep detail as editing mode only for now, untill beautifying things/
                mk: this.props.pk,
                mt: this.props.actorData.content_type,
                match: this.props.match,
                // in_grid == false, as data is object not array.
            };
            prop_bundle.prop_bundle = prop_bundle;
        }

        return <React.Fragment>
            <div className={"l-grid"}>
                <DataTable
                    header={header}
                    footer={paginator}
                    responsive={true}
                    resizableColumns={true}
                    value={rows} paginator={false}
                    // selectionMode="single"
                    editable={true}
                    selectionMode="multiple"
                    onSelectionChange={e => this.setState({selectedRows: e.value})}
                    onRowSelect={this.onRowSelect} // Todo: allow multi-selection
                    selection={this.state.selectedRows}
                    loading={this.state.loading}
                    emptyMessage={this.state.emptyMessage}
                    ref={(ref) => this.dataTable = ref}
                    onRowDoubleClick={this.onRowDoubleClick}
                >

                    {this.get_cols()}
                </DataTable>
            </div>
            {this.props.actorData.pv_layout && this.state.showPVDialog &&
            <Dialog header="PV Values"
                    footer={<div>
                        <Button style={{width: "33px"}} icon={"pi pi-times-circle"}
                                onClick={() => this.reload({pv: {}})}/>
                        <Button style={{width: "33px"}} icon={"pi pi-check"}
                                onClick={(e) => this.setState({showPVDialog: false})}/>
                    </div>}
                    visible={this.state.showPVDialog} modal={true}
                    onHide={(e) => this.setState({showPVDialog: false})}>
                <MainPVComp {...prop_bundle} elem={this.props.actorData.pv_layout.main} main={true}/>
            </Dialog>}

        </React.Fragment>

    }
};
