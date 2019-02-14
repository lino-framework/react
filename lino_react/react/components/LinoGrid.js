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

import {Dialog} from 'primereact/dialog';

import {debounce} from "./LinoUtils";

import LinoComponents from "./LinoComponents";
import LinoBbar from "./LinoBbar";

export class LinoGrid extends Component {

    static propTypes = {
        inDetail: PropTypes.bool,
        match: PropTypes.object,
        actorId: PropTypes.string,
        packId: PropTypes.string,
        actorData: PropTypes.object,
        mt: PropTypes.int,
        mk: PropTypes.string // we want to allow str / slug pks
        // todo: in_detail : PropTypes.bool
    };

    static defaultProps = {
        inDetail: false,
    };

    constructor(props) {
        super(props);
        this.state = {
            data: null,
            rows: [],
            show_columns: {}, // Used to override hidden value for columns
            // for pager
            totalRecords: 0,
            rowsPerPage: props.actorData.preview_limit,
            page: 0,
            topRow: 0,
            // todo pvs: paramValues: [],
            query: "",

            selectedRows: [],
            title: "", // defaults to actor label?
            loading: true,

            pv_values: {}

        };
        this.reload = debounce(this.reload.bind(this), 200);
        this.refresh = this.reload;
//        this.log = debounce(this.log.bind(this), 200);
        this.onRowSelect = this.onRowSelect.bind(this);
        this.columnTemplate = this.columnTemplate.bind(this);
        this.expand = this.expand.bind(this);
        this.quickFilter = this.quickFilter.bind(this);
        this.showParamValueDialog = this.showParamValueDialog.bind(this);
        this.update_pv_values = this.update_pv_values.bind(this);
        this.pvObj2array = this.pvObj2array.bind(this);
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
            const prop_bundle = {
                data: rowData,
                disabled_fields: this.state.disabled_fields,
                // update_value: this.update_value // No editable yet
                edit_mode: false,
                hide_label: true,
                in_grid: true,
                column: column,
                editing_mode: false,
                match: this.props.match
            };
            prop_bundle.prop_bundle = prop_bundle;
            return <Template {...prop_bundle} elem={col}/>;
        }
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
        originalEvent.stopPropagation(); // Prevents multiple fires when selecting checkbox.
        if (type === "checkbox" || type === "radio") {
            return // We only want selection, no nav.
        }
        let pk = data[this.props.actorData.pk_index];
        if (data[this.props.actorData.pk_index]) {
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

//    log(s){console.log(s)}

    pvArray2Obj(ar) {

    }

    pvObj2array(obj) {
        return this.props.actorData.pv_fields.map((f_name) => {
            let value = this.state.pv_values[f_name + "Hidden"] || this.state.pv_values[f_name];
            if (value === undefined) value = null;
            return value
        })
    }

    reload({page = undefined, query = undefined, pv = undefined} = {}) {
        let state = {
            // data: null,
            // rows: [],
            loading: true,
        };
        query !== undefined && (state.query = query); // update state if query passed to method // QuickSearch string
        page && (state.page = page);
        page = page || this.state.page;

        this.setState(state);
        let ajax_query = {
            fmt: "json",
            limit: this.state.rowsPerPage,
            start: page * this.state.rowsPerPage, // Needed due to race condition when setting-state
            // todo pv
            query: query !== undefined ? query : this.state.query // use given query or state-query
        };

        if (this.props.actorData.pv_layout) {
            let search = queryString.parse(this.props.match.history.location.search);
            // use either, pv passed with reload method, current state, or failing all, in url

            if (pv === undefined && this.state.pv_values === {}) {
                ajax_query.pv  = search.pv
            }
            else {
                ajax_query.pv = this.pvObj2array(pv || this.state.pv_values);
            }
            // convert pv values from obj to array and add to ajax call

        }

        if (this.props.actorData.slave) {
            this.props.mk && (ajax_query.mk = this.props.mk);
            this.props.mt && (ajax_query.mt = this.props.mt);
        }
        // console.log("table pre-GET", ajax_query, this.state);

        fetchPolyfill(`/api/${this.props.packId}/${this.props.actorId}?${queryString.stringify(ajax_query)}`).then(
            (res) => (res.json())
        ).then(
            (data) => {
                // console.log("table GET", data);
                let rows = data.rows;
                delete data.rows;
                let pv_values = data.param_values;
                delete data.param_values;

                this.setState({
                    data: data,
                    rows: rows,
                    totalRecords: data.count,
                    topRow: (page || this.state.page) * this.state.rowsPerPage,
                    loading: false,
                    title: data.title,
                    pv_values: pv_values, // This might cause race conditions with editing may PV's quickly.
                    // page: page
                });
            }
        )
    }

    componentDidUpdate(prevProps) {
        // console.log("Detail compDidUpdate")
        if (this.props.pk !== prevProps.pk ||
            this.props.mk !== prevProps.mk ||
            this.props.mt !== prevProps.mt) {
            this.reload();
        }
    }

    componentDidMount() {
        this.reload();
        // console.log(this.props.actorId, "LinoGrid ComponentMount", this.props);
    }

    update_pv_values(values) {
        // console.log(v);
        this.setState((prevState) => {
            let search = queryString.parse(this.props.match.history.location.search);
            let pv = Object.assign(prevState.pv_values, {...values});
            search.pv = this.pvObj2array(pv);
            this.props.match.history.replace({search: queryString.stringify(search)});
            return {pv_values: pv};
        });
        this.reload();
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

                    {this.props.actorData.pv_layout &&
                    <Button icon={"pi pi-filter"} onClick={this.showParamValueDialog}/>
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

        if (this.props.actorData.pv_layout) {
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
                    selectionMode="multiple"
                    onSelectionChange={e => this.setState({selectedRows: e.value})}
                    onRowSelect={this.onRowSelect} // Todo: allow multi-selection
                    selection={this.state.selectedRows}
                    loading={this.state.loading}
                >

                    {["SelectCol"].concat(this.props.actorData.col.filter((col) => !col.hidden || this.state.show_columns[col.name])).map((col, i) => (
                            col === "SelectCol" ? <Column selectionMode="multiple"
                                                          style={{
                                                              width: '2em',
                                                              "padding": "unset",
                                                              "text-align": "center"
                                                          }}/> :
                                <Column field={String(col.fields_index)}
                                        body={this.columnTemplate(col)}
                                        header={col.label}
                                        key={key(col)}
                                        style={{width: `${col.width || col.preferred_width}ch`}}
                                        className={`l-grid-col-${col.name}`}/>
                        )
                    )
                    }
                </DataTable>
            </div>
            {this.props.actorData.pv_layout && <Dialog header="PV Values" visible={this.state.showPVDialog} modal={true}
                                                       onHide={(e) => this.setState({showPVDialog: false})}>
                <MainPVComp {...prop_bundle} elem={this.props.actorData.pv_layout.main} main={true}/>
            </Dialog>}

        </React.Fragment>

    }
};
