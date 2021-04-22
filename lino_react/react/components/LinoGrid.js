import "./LinoGrid.css"

import React, {Component} from "react";
import key from "weak-key";
import PropTypes from "prop-types";

import AbortController from 'abort-controller';
import {fetch as fetchPolyfill} from 'whatwg-fetch';
import queryString from 'query-string';
import regeneratorRuntime from "regenerator-runtime"; // require for async request (in getting mention/tag suggestion)

import {DataView, DataViewLayoutOptions} from 'primereact/dataview';
import {Button} from 'primereact/button';
import {Card} from 'primereact/card';
import {Dialog} from 'primereact/dialog';
import {Panel} from 'primereact/panel';
import {ToggleButton} from 'primereact/togglebutton';

import {debounce, pvObj2array, isMobile, find_cellIndex, gridList2Obj} from "./LinoUtils";

import LinoDTable from "./LinoDTable";
import LinoHeader from "./LinoHeader";
import LinoLayout from "./LinoComponents";
import LinoPaginator from "./LinoPaginator";


export class LinoGrid extends Component {

    static propTypes = {
        inDetail: PropTypes.bool,
        depth: PropTypes.number,
        display_mode: PropTypes.string,
        show_top_toolbar: PropTypes.bool,
        data_view: PropTypes.bool,
    };

    static defaultProps = {
        inDetail: false,
        depth: 0,
    };

    get_full_id() {
        return `${this.props.packId}.${this.props.actorId}`
    }

    constructor(props) {
        super(props);
        let search = queryString.parse(this.props.match.history.location.search);
        let page_key = `${this.props.inDetail ? this.get_full_id() + "." : ""}page`;
        this.state = {
            // data_view: (props.actorData.display_mode === "grid" || props.actorData.card_layout === undefined) ? false : true,
            data_view: false,
            display_mode: props.display_mode || props.actorData && props.actorData.display_mode && props.actorData.display_mode !== "summary" && props.actorData.display_mode || "grid",
            layout: "table",
            loading: true,
            selectedRows: [],
            show_top_toolbar: isMobile() ? false : true,
        };
        if (props.display_mode) {
            console.warn("there's a display_mode prop in LinoGrid!");
        }
        this.data = {
            cols: undefined,
            component: {},
            count: undefined,
            data: null,
            page: search[page_key] ? search[page_key] - 1 : 0,
            pv_values: {},
            rows: [],
            rowsPerPage: (props.actorData.preview_limit === 0) ? 99999 : props.actorData.preview_limit,
            show_columns: props.actorData.col.filter((col) => !col.hidden).map((col) => col.fields_index),
            sortCol: undefined,
            sortField: undefined,
            sortFieldName: undefined,
            sortOrder: 0,
            title: "",
            topRow: 0,
        };
        this.get_data = this.get_data.bind(this);
        this.reload = this.reload.bind(this);
        this.refresh = this.refresh.bind(this);
        this.reset = this.reset.bind(this);
        this.onRowDoubleClick = this.onRowDoubleClick.bind(this);
        this.showParamValueDialog = this.showParamValueDialog.bind(this);
        this.update_pv_values = this.update_pv_values.bind(this);
        this.update_url_values = this.update_url_values.bind(this);
        this.get_full_id = this.get_full_id.bind(this);
        this.onSort = this.onSort.bind(this);
        this.get_URL_PARAM_COLUMNS = this.get_URL_PARAM_COLUMNS.bind(this);
        this.itemTemplate = this.itemTemplate.bind(this);
        this.handleWindowChange = this.handleWindowChange.bind(this);
    }

    onSort(e) {
        let {sortField, sortOrder} = e,
            col = this.props.actorData.col.find((col) => String(col.fields_index) === sortField);
        this.data.sortField = sortField;
        this.refresh({sortCol: col, sortOrder: sortOrder});
    }

    onRowDoubleClick(e, id) {
        let {originalEvent, data, type} = e, pk;
        if (id) {
            pk = id;
        } else {
            pk = data[this.props.actorData.pk_index];
        }
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
        }
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


        if (this.data.sortFieldName && this.data.sortOrder) { // if table is sorted add sort.
            ajaxArgs.dir = this.data.sortOrder === 1 ? "ASC" : "DESC";
            ajaxArgs.sort = this.data.sortFieldName;
        }

        if (this.data.pv_values) ajaxArgs.pv = pvObj2array(this.data.pv_values, this.props.actorData.pv_fields);

        return ajaxArgs

    }

    /**
     * Opens PV dialog for filtering rows server-side
     */
    showParamValueDialog(e) {
        this.setState({showPVDialog: true});
    }

    update_url_values(vals, router) {
        // Does nothing.
        let search = queryString.parse(router.history.location.search);
        Object.assign({}, search, {...vals}); // We are not catching the values here!!!
        router.history.replace({search: queryString.stringify(search)});
    }

    reload(values) {
        this.setState({loading: true});
        this.get_data(values, this.controller.signal, true);
    }

    refresh(values) {
        this.get_data(values, this.controller.signal, true);
    }

    reset(values) {
        Object.assign(this.data, {
            page: 0,
            sortOrder: 0,
            query: "",
            sortField: undefined,
        });
        this.refresh(values);
    }

    async get_data({
            page = undefined,
            query = undefined,
            pv = undefined,
            sortCol = undefined,
            sortOrder = undefined,
            wt = undefined,
        } = {}, signal, reload) {
        if (reload) Object.assign(this.data, {loading: true, fetching: "on"});
        let pass = {loading: true};
        pass.query = query !== undefined ? query === "" ? undefined : query : this.data.query;
        pass.page =  page !== undefined ? page : this.data.page;
        pass.sortFieldName = sortCol !== undefined ? sortCol.name : this.data.sortFieldName;
        pass.sortOrder = sortOrder !== undefined ? sortOrder : this.data.sortOrder;
        pass.wt = wt !== undefined ? wt : this.state.data_view ? "c" : "g";
        let ajax_query = {
            fmt: "json",
            start: pass.page * this.data.rowsPerPage,
            limit: this.data.rowsPerPage,
            query: pass.query,
            rp: this.rp,
            wt: pass.wt,
        };
        pass.sortFieldName !== undefined && (ajax_query.sort = pass.sortFieldName);
        pass.sortOrder !== 0 && (ajax_query.dir = pass.sortOrder === 1 ? "ASC" : "DESC");
        if (this.props.actorData.use_detail_params_value && this.props.parent_pv) {
            ajax_query.pv = pvObj2array(this.props.parent_pv, this.props.actorData.pv_fields);
        } else if (this.props.actorData.pv_layout) {
            let search = queryString.parse(this.props.match.history.location.search);
            // use either, pv passed with reload method, current state, or failing all, in url
            if (!this.props.inDetail && pv === undefined && Object.keys(this.data.pv_values).length === 0) {
                ajax_query.pv = search.pv
            } else if (Object.keys(this.data.pv_values).length !== 0) { // only apply when there's some data there to insure getting of default values form server
                ajax_query.pv = pvObj2array(pv || this.data.pv_values, this.props.actorData.pv_fields);
            }
            // convert pv values from obj to array and add to ajax call
        }
        this.props.mk !== undefined && (ajax_query.mk = this.props.mk);
        this.props.mt !== undefined && (ajax_query.mt = this.props.mt);
        window.App.add_su(ajax_query);
        await fetchPolyfill(
            `api/${this.props.packId}/${this.props.actorId}?${queryString.stringify(ajax_query)}`,
            {signal: signal}).then(
                window.App.handleAjaxResponse
            ).then(data => {
                if (!data.success) {
                    Object.assign(this.data, {
                        count: 0,
                        rows: [],
                    });
                } else {
                    Object.assign(this.data, {
                        count: data.count,
                        pv_values: this.props.inDetail ? {} : data.param_values,
                        rows: data.rows,
                        title: data.title,
                    });
                }
                Object.assign(this.data, {
                    data: data,
                    loading: false,
                    page: pass.page,
                    query: pass.query,
                    sortFieldName: pass.sortFieldName,
                    sortOrder: pass.sortOrder,
                    topRow: (pass.page) * this.data.rowsPerPage,
                });
                if (reload) this.setState({loading: false});
                this.data.fetching = "off";
            }).catch((error) => {
                if (error.name === "AbortError") {
                    console.warn("Request Aborted due to component unmount!");
                } else {
                    window.App.handleAjaxException(error);
                }
            });
    }

    componentDidUpdate(prevProps) {
        // console.log("Detail compDidUpdate")
        if (this.props.pk !== prevProps.pk ||
            this.props.mk !== prevProps.mk ||
            this.props.mt !== prevProps.mt ||
            (prevProps.reload_timestamp !== 0 && this.props.reload_timestamp !== prevProps.reload_timestamp)
        ) {
            this.reload();
        }
    }

    componentDidMount() {
        this.controller = new AbortController();
        this.get_data({}, this.controller.signal, true);
        window.addEventListener("resize", this.handleWindowChange);
    }

    componentWillUnmount() {
        this.controller.abort();
        window.removeEventListener("resize", this.handleWindowChange);
    }

    handleWindowChange() {
        this.setState({show_top_toolbar: isMobile() ? false : true});
    }

    update_pv_values(values) {
        let old_pv_values = pvObj2array(this.data.pv_values, this.props.actorData.pv_fields),
            updated_pv = Object.assign({}, this.data.pv_values, {...values}),
            updated_array_pv = pvObj2array(updated_pv, this.props.actorData.pv_fields);
        // console.log(v);
        // this.setState((prevState) => {
        //     let old_pv_values = pvObj2array(prevState.pv_values, this.props.actorData.pv_fields);
        //     let updated_pv = Object.assign({}, prevState.pv_values, {...values});
        //     let updated_array_pv = pvObj2array(updated_pv, this.props.actorData.pv_fields);
        //
        //     if (queryString.stringify(old_pv_values) !== queryString.stringify(updated_array_pv)) {
        //         // There's a change in the hidden values of PV's
        //
        //         // Update url query params
        //         let search = queryString.parse(this.props.match.history.location.search);
        //         search.pv = updated_array_pv;
        //         this.props.match.history.replace({search: queryString.stringify(search)});
        //
        //
        //         // this.reload();
        //         return {pv_values: updated_pv};
        //     }
        // });
    }

    itemTemplate(rowData, layout) {
        const content = rowData.main_card_body ? <div dangerouslySetInnerHTML={{__html: rowData.main_card_body}}/> :
            <LinoLayout
                window_layout={this.props.actorData.card_layout}
                data={rowData}
                actorId={this.get_full_id()}
                actorData={this.props.actorData}
                editing_mode={false}
                pk={rowData["id"]}
                mk={this.props.mk}
                mt={this.props.actorData.content_type}
                depth={this.props.depth + 1}
                match={this.props.match}
                reload_timestamp={this.state.reload_timestamp}
            />
        if (layout === "list") {
            return <Panel
                className={"l-itemTemplate"}
                header={<div dangerouslySetInnerHTML={{__html: rowData.card_title}}/>}
                style={{margin: "5px"}}
                toggleable={true}>
                {content}
            </Panel>
        } else {
            return <Card
                title={<p>
                    {rowData.card_title} <span
                        className="l-span-clickable"
                        onClick={(e) => {
                            this.onRowDoubleClick(e, rowData.id);
                        }}>
                        <i>♂</i>
                    </span>
                </p>}
                style={{margin: "20px"}}>
                {content}
            </Card>
        }
    }

    render() {
        if (this.props.actorData.hide_if_empty && this.props.inDetail && this.data.rows.length === 0) {
            return null
        }
        return <React.Fragment>
            <h1 className={"l-detail-header"}>
                <span dangerouslySetInnerHTML={{ __html:this.data.title || this.props.actorData.label || "\u00a0" }}></span>
                {!this.props.actorData.slave && <ToggleButton
                    style={{float: 'right'}}
                    checked={this.state.show_top_toolbar}
                    onChange={e => {
                        this.setState({show_top_toolbar: !this.state.show_top_toolbar});
                    }}
                    onLabel=''
                    offLabel=''
                    onIcon='pi pi-caret-up'
                    offIcon='pi pi-caret-down'
                    iconPos="right"
                />}
            </h1>
            <div className={"l-grid"} >
                {!this.props.actorData.slave && <div className="l-header"><LinoHeader parent={this}/></div>}
                {((!this.state.loading) && (!this.state.data_view))/*|| this.props.actorData.card_layout === undefined)*/?
                    <LinoDTable
                        {...this.props}
                        // disabled_fields={this.state.disabled_fields}
                        fetching={this.data.fetching}
                        linoGrid={this}
                        loading={this.data.loading}
                        onRowDoubleClick={this.onRowDoubleClick}
                        onSort={this.onSort}
                        pv={this.state.pv}
                        refresh={this.refresh}
                        rows={this.data.rows}
                        selectedRows={this.state.selectedRows}
                        show_columns={this.data.show_columns}
                        sortField={this.data.sortField}
                        sortOrder={this.data.sortOrder}/>
                    : this.props.actorData.borderless_list_mode ?
                        <div>
                            {this.data.rows.map((row, index) => (
                                <div key={this.data.rows[index].id}>{this.itemTemplate(row)}</div>
                            ))}
                        </div>
                        : <DataView
                            value={this.data.rows}
                            layout={this.state.layout}
                            lazy={true}
                            itemTemplate={this.itemTemplate}
                            itemKey={(data, index) => (this.data.rows[index].id)}/>}
            </div>
            {!this.state.loading && <LinoPaginator parent={this}/>}
            {this.props.actorData.pv_layout && this.state.showPVDialog &&
            <Dialog header="Filter Parameters"
                    footer={<div>
                        <Button
                            style={{width: "33px"}}
                            icon={"pi pi-times-circle"}
                            onClick={() => this.reload({pv: {}})}
                            />
                        <Button
                            style={{width: "33px"}}
                            icon={"pi pi-check"}
                            onClick={(e) => {
                                this.setState({showPVDialog: false});
                            }}/>
                    </div>}
                    visible={this.state.showPVDialog} modal={true}
                    onHide={(e) => {
                        this.setState({showPVDialog: false});
                    }}>

                {this.props.actorData.pv_layout && this.state.showPVDialog &&
                <LinoLayout
                    window_layout={this.props.actorData.pv_layout}
                    window_type={"p"} // param value layout, used for blank filter val
                    actorData={this.props.actorData}
                    data={this.data.pv_values}
                    actorId={this.get_full_id()}
                    update_value={this.update_pv_values}
                    editing_mode={true}
                    mk={this.props.mk}
                    mt={this.props.actorData.content_type}
                    match={this.props.match}
                />}
            </Dialog>}

        </React.Fragment>

    }
};
