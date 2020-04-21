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
import {MultiSelect} from 'primereact/multiselect';
import {Dialog} from 'primereact/dialog';

import {debounce, pvObj2array, isMobile, find_cellIndex} from "./LinoUtils";

import LinoLayout from "./LinoComponents";
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
        parent_pv: PropTypes.object,

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
            toggle_col: false, // show multiselect elem for thing
            cols: undefined,
            //show_columns: search['show_columns'] ? search['show_columns'].split(",") : undefined,
            show_columns: undefined,
            // for pager
            totalRecords: 0,
            rowsPerPage: (props.actorData.preview_limit === 0) ? 99999 : props.actorData.preview_limit,
            page: search[page_key] ? search[page_key] - 1 : 0,
            topRow: 0,
            count: undefined,
            // todo pvs: paramValues: [],
            query: "",
            selectedRows: [],
            title: "", // defaults to actor label?
            loading: true,

            pv_values: {},
            editingCellIndex: undefined,
            editingPK: undefined,
            editingValues: {},

            sortField: undefined, // Sort data index   (used in PR)
            sortFieldName: undefined, // Sort col.name (used in Lino)
            // sortOrder: undefined

            sortOrder: search['sortOrder'] ? search['sortOrder'] : undefined,
            sortCol: search['sortField'] ? this.props.actorData.col.find((col) => String(col.fields_index) === search['sortField']) : undefined

        };
        this.state.cols = props.actorData.col.map((column, i) => (
            {
                label: column.label,
                value: i + "",
                col: column
            }));
        if (this.state.show_columns === undefined) {
            this.state.show_columns = this.state.cols.filter((col) => !col.col.hidden).map((col) => col.value); // Used to override hidden value for columns
        }

        this.reload = debounce(this.reload.bind(this), 200);
        this.refresh = this.reload;
//        this.log = debounce(this.log.bind(this), 200);
        this.onRowSelect = this.onRowSelect.bind(this);
        this.onRowDoubleClick = this.onRowDoubleClick.bind(this);
        this.columnTemplate = this.columnTemplate.bind(this);
        this.columnEditor = this.columnEditor.bind(this);
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
        this.onSort = this.onSort.bind(this);
        this.get_URL_PARAM_COLUMNS = this.get_URL_PARAM_COLUMNS.bind(this);


    }

    /**
     * Template function generator for grid data.
     * Looks up the correct template and passes in correct data.
     * @param col : json Lino site data, the col value.
     */
    columnTemplate(col) {
        // console.log(col);
        return (rowData, column) => {
            let pk = rowData[this.props.actorData.pk_index];
            let cellIndex = column.cellIndex;
            let {editingCellIndex, editingPK} = this.state;
            // let editing = pk == editingPK && cellIndex == editingCellIndex;
            const prop_bundle = {
                actorId: this.get_full_id(),
                actorData: this.props.actorData,
                data: (pk === null && this.state.editingPK === null) ? this.state.editingValues : rowData,
                disabled_fields: this.state.disabled_fields || [],
                update_value: this.update_col_value, // No editable yet
                editing_mode: false,
                hide_label: true,
                in_grid: true,
                column: column,
                match: this.props.match,
                container: this.dataTable.table,
                mk: this.props.mk,
                mt: this.props.mt,
            };
            return <LinoLayout {...prop_bundle} elem={col}/>;
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
        return (column) => {
            const prop_bundle = {
                actorId: this.get_full_id(),
                data: this.state.editingValues,
                actorData: this.props.actorData,
                disabled_fields: this.state.disabled_fields || [],
                update_value: this.update_col_value,
                hide_label: true,
                in_grid: true,
                container: this.dataTable.table,
                column: column,
                editing_mode: true,
                match: this.props.match,
                mk: this.props.mk,
                mt: this.props.mt,

            };
            return <LinoLayout {...prop_bundle} elem={col}/>;
        }
    }

    onCancel(cellProps) {
        console.log("onCancel");
    }

    onSubmit(event, cellProps, bodyCell) {
        let {rowData, field, rowIndex} = cellProps;
        // check if new row
        // save row index
        // run ajax call on this.get_full_id url
        // Objects.assign over this.state.rows[rowIndex]
        // console.log("onSubmit", cellProps, this.state.editingValues);
        let editingPK = this.state.editingPK;
        let {key, which, target} = event;
        if (!this.editorDirty) {
            return
        }

        let td = bodyCell.container,
            tdIndex = Array.prototype.indexOf.call(td.parentElement.children, td);

        let submit = (openNextCell) => {
            window.App.runAction({
                rp: this,
                an: editingPK === null ? "grid_post" : "grid_put",
                actorId: `${this.props.packId}.${this.props.actorId}`,
                sr: editingPK === null ? undefined : editingPK,
                status: {
                    base_params: {mk: this.props.mk, mt: this.props.mt}
                },
                response_callback: (data) => {
                    // this.setState({editing_mode: false});
                    // this.consume_server_responce(data.data_record);
                    data.rows && this.setState((old) => { // update just the row
                        let state = {},
                            rows = old.rows.slice(); // make data copy
                        state.rows = rows;
                        if (editingPK === null) {
                            rows.push(rows[rowIndex].slice()); // create copy phantom row
                            state.editingPK = undefined;
                            if (openNextCell) {
                                this.editPhantomRowAgain = setTimeout(() => {
                                    //TODO open phantom row
                                    td.parentElement.nextSibling.children[tdIndex].click();
                                    // console.log("Try go find and start editing cell", target, tr)
                                }, 200)
                            }
                        }
                        else if (this.state.editingPK === data.rows[0][this.props.actorData.pk_index]) {
                            state.editingValues = Object.assign({}, {...data.rows[0]}) // update editing values
                        }
                        rows[rowIndex] = data.rows[0];
                        return state
                    })
                }
            })
        };

        if (editingPK === null) {

            if (key === "Enter") {
                submit(!event.shiftKey);

            } else {
                this.phantomSubmit = setTimeout(() => {
                    console.log("on submit timeout");

                    if (editingPK === null && !this.editorDirty) {// we've opened a new editer in phantom row

                    } else {
                        submit();
                        // this.setState((old) => {
                        //     let rows = old.rows.slice();
                        //     rows.push(rows[rows.length-1].slice());
                        //     return {rows:rows} // add new phantom rows, old will be overwriten by post callback.
                        // } )
                    }

                }, 20)
            }
        }
        else {
            submit()
        }
    }

    onEditorOpen(event, cellProps) {
        let {rowData, field} = cellProps;
        console.log("editor Open");
        let was_dirty = this.editorDirty;
        let boolField = event.type === "click" && cellProps.col.react_name === 'BooleanFieldElement';

        setTimeout(() => { // delay as we should submit before clearing editing values.
                this.editorDirty = false;
                // console.log("editor Open timeout");
                // console.log('this.props',this.props);
                // console.log('rowData',rowData);
                // console.log('field',field);
                this.setState((old) => {
                    // console.log('old',old);
                    let editingPK, editingValues = {};

                    if (old.editingPK === null && rowData[this.props.actorData.pk_index] === old.editingPK && was_dirty) {
                        this.editorDirty = true; // we have old values so still dirty.
                        clearTimeout(this.phantomSubmit);
                        if (boolField) {
                            old.editingValues[field] = !old.editingValues[field];
                        }
                        return {editingValues: Object.assign({}, {...old.editingValues})} // keep old editing values
                    }
                    else if (rowData[this.props.actorData.pk_index] === null) {
                        if (boolField) {
                            this.editorDirty = true;
                            editingValues[field] = true
                        }
                        return {
                            editingPK: null, // start editing a phantom with empty values not null values.
                            editingValues: editingValues
                        }
                    }
                    else {
                        if (boolField) {
                            // When we edit BooleanFieldElement field we change its value
                            this.editorDirty = true; // Make the editor dirty as we want to edit on first click
                            return {
                                editingPK: rowData[this.props.actorData.pk_index],
                                editingValues: {[field]: !rowData[field]}
                            }
                        }
                        return {
                            // editingCellIndex:cellIndex,
                            editingPK: rowData[this.props.actorData.pk_index], // used when getting return data from row save, in that case, we set new data as editingValues
                            editingValues: Object.assign({}, {...rowData}) // made copy of all row data
                        }
                    }

                })
            },
            5)
    }

    onSort(e) {
        let {sortField, sortOrder} = e,
            col = this.props.actorData.col.find((col) => String(col.fields_index) === sortField);
        this.reload({sortCol: col, sortOrder: sortOrder})
    }

    update_col_value(v, elem, col) { // on change method for cell editing.
        this.editorDirty = true;
        console.log("update_col_val");

        this.setState((old => {
            // Object.assign(state.rows[col.rowIndex],{...v});

            if (old.editingPK === null &&
                col.rowData[this.props.actorData.pk_index] === old.editingPK) {
                return {
                    editingValues: Object.assign({...this.state.editingValues}, {...v})
                }
            }

            return {
                // rows:state.rows,
                editingValues: Object.assign({}, {...v})
            }
        }));
        // if (Object.keys(v).length > 1) {
        //     setTimeout(() => document.body.click(), 100);
        // }
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

    get_URL_PARAM_COLUMNS(ajaxArgs = {}) /* names */ {
        // col ordering done inside DataTable
        let orderedCols = this.dataTable.getColumns(); // get columns
        orderedCols = orderedCols.filter(c => c.props.col).map((c) => (c.props.col)); // remove non lino columns, (selection box or reorder)
        let unhiddenCols = orderedCols.length; // save number of visable columns
        orderedCols = orderedCols.concat( // attach hidden columns.
            this.props.actorData.col.filter(
                allCols => orderedCols.find(c => c.name === allCols.name) === undefined)); // if col is not in ordercols add it
        let cw = Array.prototype.map.call(
            this.dataTable.table.querySelector("thead tr").getElementsByClassName("l-grid-col"), // get table headers
            (e) => e.offsetWidth).concat( //get widths
            Array.from({length: this.props.actorData.col.length - unhiddenCols}, c => 999) // pad with whatever to match length of all cols.
        );

        ajaxArgs.ci = orderedCols.map(c => c.name);
        ajaxArgs.cw = cw;
        ajaxArgs.ch = orderedCols.map((c, i) => i >= unhiddenCols); // all cols after a point are hidden.

        if (this.props.actorData.slave) {
            this.props.mt && (ajaxArgs.mt = this.props.mt);
            this.props.mk && (ajaxArgs.mk = this.props.mk);
        }


        if (this.state.sortFieldName && this.state.sortOrder) { // if table is sorted add sort.
            ajaxArgs.dir = this.state.sortOrder === 1 ? "ASC" : "DESC";
            ajaxArgs.sort = this.state.sortFieldName;
        }

        if (this.state.pv_values) ajaxArgs.pv = pvObj2array(this.state.pv_values, this.props.actorData.pv_fields);

        return ajaxArgs

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

    reload({page = undefined, query = undefined, pv = undefined, sortCol = undefined, sortOrder = undefined} = {}) {
        let sortField;
        let sortFieldName
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

        let ajax_query = {
            fmt: "json",
            limit: this.state.rowsPerPage,
            start: page * this.state.rowsPerPage, // Needed due to race condition when setting-state
            query: query !== undefined ? query : this.state.query, // use given query or state-query
            rp: this.rp
        };

        if (sortCol !== undefined) {
            state.sortField = sortCol.fields_index;
            state.sortFieldName = sortCol.name;
            sortFieldName = sortCol.name;
        } else if (this.state.sortCol !== undefined) {
            state.sortField = this.state.sortCol.fields_index;
            state.sortFieldName = this.state.sortCol.name;
            sortFieldName = this.state.sortCol.name;
        } else if (this.state.sortField !== undefined) {
            // sortField = this.state.sortField;
            sortFieldName = this.state.sortFieldName
        }
        if (sortFieldName !== undefined) {
            ajax_query.sort = sortFieldName;
        }

        if (sortOrder !== undefined) {
            state.sortOrder = sortOrder;
        } else if (this.state.sortOrder !== undefined) {
            sortOrder = this.state.sortOrder;
        }
        if (sortOrder !== undefined) {
            ajax_query.dir = sortOrder === 1 ? "ASC" : "DESC";
        }

        this.setState(state);

        let sort_values = {'sortOrder': sortOrder, 'sortField': state.sortField};
        this.update_url_values(sort_values, this.props.match);

        if (this.props.actorData.use_detail_params_value && this.props.parent_pv) {
            ajax_query.pv = pvObj2array(this.props.parent_pv, this.props.actorData.pv_fields);
        }
        else if (this.props.actorData.pv_layout) {
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

        if (this.props.mk !== undefined) {
            this.props.mk && (ajax_query.mk = this.props.mk);
        }
        if (this.props.mt !== undefined) {
            this.props.mt && (ajax_query.mt = this.props.mt);
        }

        window.App.add_su(ajax_query);
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
                        count: data.count
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

        if (this.cols === undefined) {
            // let total_widths = 0; // get total of all width values to use % rather than ch.
            // this.state.show_columns.map((i) => (this.props.actorData.col[i - 0])).forEach(
            //     (col) => total_widths += (col.width || col.preferred_width)
            // );

            this.cols = this.props.actorData.preview_limit === 0 ? [] : ["SelectCol"]; // no selection column,
            this.update_url_values({'show_columns': this.state.show_columns.toString()}, this.props.match);
            this.cols = this.cols.concat(
                this.state.show_columns.map((i) => (this.props.actorData.col[i - 0]) /*filter out hidden rows*/)
            ).map((col, i) => (
                    col === "SelectCol" ? <Column selectionMode="multiple"
                                                  style={{
                                                      width: '2em',
                                                      "padding": "unset",
                                                      "textAlign": "center"
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
                                style={{width: `${(col.width || col.preferred_width) /*/ total_widths * 100*/}ch`}}
                                className={`l-grid-col l-grid-col-${col.name} ${
                                    this.state.editingCellIndex === i ? 'p-cell-editing' : ''
                                    }`}
                                onEditorCancel={this.onCancel}
                                onEditorSubmit={this.onSubmit}
                                onEditorOpen={this.onEditorOpen}
                            // validaterEvent={"blur"}
                                isDisabled={
                                    (props) => (props.rowData[props.rowData.length - 1] ||
                                        (props.rowData[props.rowData.length - 2] !== null
                                            && //if null / phantom row / not disabled
                                            Object.keys(props.rowData[props.rowData.length - 2]).find(
                                                (e) => e === props.col.name
                                            )
                                        ))
                                }
                            // editorValidator={() => {console.log("validate");
                            //                         return false}}
                                sortable={true}
                            // sortFunction={(e)=> return }
                            // columnSortFunction={() => 1}
                        />
                )
            )
        }
        return this.cols
    }

    renderHeader() {
        let mobile = isMobile();
        let {actorData} = this.props;
        let quickFilter = (wide) => <InputText className="l-grid-quickfilter"
                                               style={{
                                                   width: wide ? "100%" : undefined,
                                                   marginRight: wide ? "1ch" : undefined,
                                                   marginLeft: wide ? "1ch" : undefined,
                                               }}
                                               placeholder="QuickSearch" /*value={this.state.query}*/
                                               onChange={(e) => this.quickFilter(e.target.value)}/>;

        return <div className="p-clearfix p-grid"
            // style={{'lineHeight': '1.87em'}}
        >
            <div className={"p-col p-justify-end"} style={{"textAlign": "left"}}>
                {!this.props.inDetail && <React.Fragment>
                    {!actorData.react_big_search && quickFilter()}

                    {this.props.actorData.pv_layout && <React.Fragment>
                        <Button icon={"pi pi-filter"} onClick={this.showParamValueDialog}/>
                        <Button icon={"pi pi-times-circle"} onClick={() => this.reload({pv: {}})}/>
                    </React.Fragment>}
                    {this.state.toggle_col ?
                        <MultiSelect value={this.state.show_columns} options={this.state.cols}
                                     ref={(el) => this.show_col_selector = el}
                                     onChange={(e) => {
                                         this.cols = undefined;
                                         clearTimeout(this.show_col_timeout);
                                         this.show_col_selector.focusInput.focus();
                                         setTimeout(() => (this.show_col_selector.dont_blur = false), 400);
                                         this.show_col_selector.dont_blur = true;
                                         this.setState({show_columns: e.value});
                                     }
                                     }
                                     onBlur={e => this.show_col_timeout = setTimeout(() => {
                                             {
                                                 if (this.show_col_selector && this.show_col_selector.dont_blur) {
                                                     this.show_col_selector.focusInput.focus();
                                                 } else {
                                                     this.setState({toggle_col: false})
                                                 }
                                             }
                                         },
                                         200)
                                     }
                        /> :
                        <Button icon={"pi pi-list"} onClick={() => {
                            this.setState({toggle_col: true})
                            setTimeout(() => {
                                    this.show_col_selector.focusInput.focus();
                                    this.show_col_selector.show();
                                },
                                25
                            )
                        }}/>}
                </React.Fragment>}


            </div>
            <div className={"p-col p-justify-center"}><span
                className="l-grid-header">{this.state.title || this.props.actorData.label}</span></div>

            <div className={"p-col p-justify-end"}>{this.props.inDetail &&
            <Button className="l-button-expand-grid p-button-secondary" onClick={this.expand}
                    icon="pi pi-external-link"
                    style={{'float': 'right'}}/>}</div>
            {!this.props.inDetail && !this.props.actorData.hide_top_toolbar &&
            <div className={"p-col-12"} style={{"textAlign": "left"}}>

                <LinoBbar actorData={this.props.actorData} sr={this.state.selectedRows} reload={this.reload}
                          srMap={(row) => row[this.props.actorData.pk_index]}
                          rp={this} an={'grid'}
                          runAction={this.runAction}/>
            </div>}
            {!this.props.inDetail && actorData.react_big_search && quickFilter(true)}
        </div>
    }

    renderPaginator() {

        if (this.props.actorData.preview_limit === 0) {
            return undefined
        }

        return <Paginator
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
            }}
            rightContent={
                this.state.count && <span className={"l-grid-count"}><span>{this.state.count}</span> rows</span>
            }
        />;
    }

    onColReorder(e) {
        // console.log('e.event',e.event);
        let show_columns = e.event.filter((c) => c.props.cellIndex).map((col) => col.props.cellIndex - 1);
        // console.log('show_columns',show_columns);
        this.setState({'show_columns': show_columns});
        this.update_url_values({'show_columns': show_columns.toString()}, this.props.match);
    }

    render() {
        const {rows} = this.state;
        // const Comp = "Table";
        // return loaded ? this.props.render(data, Comp) : <p>{placeholder}</p>;
        let {actorData} = this.props;
        const paginator = this.renderPaginator();
        const header = this.renderHeader();

        return <React.Fragment>
            <div className={"l-grid"}>
                <DataTable
                    reorderableColumns={true}
                    header={header}
                    footer={paginator}
                    responsive={actorData.react_responsive
                    }
                    resizableColumns={true}
                    value={rows} paginator={false}
                    // selectionMode="single"
                    editable={true}
                    // selectionMode={this.props.actorData.hide_top_toolbar ? "single" : "multiple" } // causes row selection
                    selectionMode={this.props.actorData.editable ? undefined : "multiple"} // causes row selection

                    onSelectionChange={e => this.setState({selectedRows: e.value})}
                    onColReorder={e => this.onColReorder({event: e.columns})}
                    onRowSelect={this.onRowSelect}
                    selection={this.props.actorData.hide_top_toolbar ? undefined : this.state.selectedRows}
                    loading={this.state.loading}
                    emptyMessage={this.state.emptyMessage}
                    ref={(ref) => this.dataTable = ref}
                    onRowDoubleClick={this.onRowDoubleClick}
                    onSort={this.onSort}
                    // sortMode={"multiple"}
                    // multiSortMeta={multiSortMeta}
                    sortField={this.state.sortField + ""}
                    sortOrder={this.state.sortOrder}
                    lazy={true}

                >

                    {this.get_cols()}
                </DataTable>
            </div>
            {this.props.actorData.pv_layout && this.state.showPVDialog &&
            <Dialog header="Filter Parameters"
                    footer={<div>
                        <Button style={{width: "33px"}} icon={"pi pi-times-circle"}
                                onClick={() => this.reload({pv: {}})}/>
                        <Button style={{width: "33px"}} icon={"pi pi-check"}
                                onClick={(e) => this.setState({showPVDialog: false})}/>
                    </div>}
                    visible={this.state.showPVDialog} modal={true}
                    onHide={(e) => this.setState({showPVDialog: false})}>

                {this.props.actorData.pv_layout && this.state.showPVDialog &&
                <LinoLayout
                    window_layout={this.props.actorData.pv_layout}
                    actorData={this.props.actorData}
                    data={this.state.pv_values}
                    actorId={this.get_full_id()}
                    update_value={this.update_pv_values}
                    editing_mode={true}
                    mk={this.props.mt}
                    mt={this.props.actorData.content_type}
                    match={this.props.match}
                />}
            </Dialog>}

        </React.Fragment>

    }
};
