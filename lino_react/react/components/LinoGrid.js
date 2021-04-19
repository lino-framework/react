import "./LinoGrid.css"

import React, {Component} from "react";
import PropTypes from "prop-types";

import queryString from 'query-string';
import key from "weak-key";
import {fetch as fetchPolyfill} from 'whatwg-fetch' // fills fetch

import {DataView, DataViewLayoutOptions} from 'primereact/dataview';
import {Paginator} from 'primereact/paginator';
import {Button} from 'primereact/button';
import {Card} from 'primereact/card';
import {InputText} from 'primereact/inputtext';
import {Dropdown} from 'primereact/dropdown';
import {MultiSelect} from 'primereact/multiselect';
import {Dialog} from 'primereact/dialog';
import {Panel} from 'primereact/panel';
import {ProgressBar} from 'primereact/progressbar';
import {ToggleButton} from 'primereact/togglebutton';

import {debounce, pvObj2array, isMobile, find_cellIndex, gridList2Obj} from "./LinoUtils";

import LinoBbar from "./LinoBbar";
import LinoDTable from "./LinoDTable";
import LinoLayout from "./LinoComponents";


export class LinoGrid extends Component {

    static propTypes = {
        inDetail: PropTypes.bool,
        match: PropTypes.object,
        actorId: PropTypes.string, // AllTickets
        packId: PropTypes.string,  // tickets
        actorData: PropTypes.object,
        mt: PropTypes.number,
        mk: PropTypes.string, // we want to allow str / slug pks
        reload_timestamp: PropTypes.number, // used to propogate a reload
        parent_pv: PropTypes.object,
        depth: PropTypes.number,
        display_mode: PropTypes.string, // "list", // or "grid" // "table"
        show_top_toolbar: PropTypes.bool,
        data_view: PropTypes.bool,
    };

    static defaultProps = {
        inDetail: false,
        depth: 0,
        // display_mode:"grid", // "list", // or  // "cards"
    };

    get_full_id() {
        return `${this.props.packId}.${this.props.actorId}`
    }

    constructor(props) {
        super(props);
        let search = queryString.parse(this.props.match.history.location.search);
        let page_key = `${this.props.inDetail ? this.get_full_id() + "." : ""}page`;
        // Categorization adjuscent to each state depending on the type whether Cosmetic or not.
        // Cosmetic & Static will stay and the NotCosmetic have to go away. There's also ===NOTSURE===.
        this.state = {
            loading: true,
            display_mode: props.display_mode || props.actorData && props.actorData.display_mode && props.actorData.display_mode !== "summary" && props.actorData.display_mode || "grid",
            layout: "list",
            show_top_toolbar: isMobile() ? false : true,
            data_view: (props.actorData.display_mode === "grid" || props.actorData.card_layout === undefined) ? false : true,
        };
        if (props.display_mode) {
            console.warn("there's a display_mode prop in LinoGrid!");
        }
        // Move data that does not require render() call from this.state to this.gridData
        this.gridData = {
            cols: undefined,
            component: {},
            count: undefined,
            data: null,
            page: search[page_key] ? search[page_key] - 1 : 0,
            pv_values: {},
            rows: [],
            rowsPerPage: (props.actorData.preview_limit === 0) ? 99999 : props.actorData.preview_limit,
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
        this.onRowDoubleClick = this.onRowDoubleClick.bind(this);
        this.expand = this.expand.bind(this);
        this.showParamValueDialog = this.showParamValueDialog.bind(this);
        this.update_pv_values = this.update_pv_values.bind(this);
        this.update_url_values = this.update_url_values.bind(this);
        this.update_col_value = this.update_col_value.bind(this);
        this.get_full_id = this.get_full_id.bind(this);
        this.onSort = this.onSort.bind(this);
        this.get_URL_PARAM_COLUMNS = this.get_URL_PARAM_COLUMNS.bind(this);
        // this.renderDataTable = this.renderDataTable.bind(this);
        this.itemTemplate = this.itemTemplate.bind(this);
        // this.renderDataView = this.renderDataView.bind(this);
        this.renderParamValueControls = this.renderParamValueControls.bind(this);
        this.renderToggle_colControls = this.renderToggle_colControls.bind(this);
        this.renderDataViewLayout = this.renderDataViewLayout.bind(this);
        this.renderExpandButton = this.renderExpandButton.bind(this);
        this.renderQuickFilter = this.renderQuickFilter.bind(this);
        this.renderActionBar = this.renderActionBar.bind(this);
        this.renderSimpleHeader = this.renderSimpleHeader.bind(this);
        this.renderDetailHeader = this.renderDetailHeader.bind(this);
        this.renderMainGridHeader = this.renderMainGridHeader.bind(this);
        this.handleWindowChange = this.handleWindowChange.bind(this);
    }

    onSort(e) {
        let {sortField, sortOrder} = e,
            col = this.props.actorData.col.find((col) => String(col.fields_index) === sortField);
        this.gridData.sortField = sortField;
        this.refresh({sortCol: col, sortOrder: sortOrder});
    }

    update_col_value(v, elem, col) {
        (!this.editorDirty) && (this.editorDirty = true);
        this.gridData.editingValues = Object.assign({}, {...v});
        this.gridData.editingCol = col;
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

    onRowDoubleClick(e) {
        let {originalEvent, data, type} = e;
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


        if (this.gridData.sortFieldName && this.gridData.sortOrder) { // if table is sorted add sort.
            ajaxArgs.dir = this.gridData.sortOrder === 1 ? "ASC" : "DESC";
            ajaxArgs.sort = this.gridData.sortFieldName;
        }

        if (this.gridData.pv_values) ajaxArgs.pv = pvObj2array(this.gridData.pv_values, this.props.actorData.pv_fields);

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
        this.get_data(values, true);
    }

    refresh(values) {
        this.get_data(values, true);
    }

    get_data({page = undefined, query = undefined, pv = undefined, sortCol = undefined, sortOrder = undefined, wt = undefined} = {}, reload) {
        if (reload) Object.assign(this.gridData, {loading: true, fetching: "on"});
        let pass = {loading: true};
        pass.query = query !== undefined ? query === "" ? undefined : query : this.gridData.query;
        pass.page =  page !== undefined ? page : this.gridData.page;
        pass.sortFieldName = sortCol !== undefined ? sortCol.name : this.gridData.sortFieldName;
        pass.sortOrder = sortOrder !== undefined ? sortOrder : this.gridData.sortOrder;
        pass.wt = wt !== undefined ? wt : this.state.data_view ? "c" : "g";
        let ajax_query = {
            fmt: "json",
            start: pass.page * this.gridData.rowsPerPage,
            limit: this.gridData.rowsPerPage,
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
            if (!this.props.inDetail && pv === undefined && Object.keys(this.gridData.pv_values).length === 0) {
                ajax_query.pv = search.pv
            } else if (Object.keys(this.gridData.pv_values).length !== 0) { // only apply when there's some data there to insure getting of default values form server
                ajax_query.pv = pvObj2array(pv || this.gridData.pv_values, this.props.actorData.pv_fields);
            }
            // convert pv values from obj to array and add to ajax call
        }
        this.props.mk !== undefined && (ajax_query.mk = this.props.mk);
        this.props.mt !== undefined && (ajax_query.mt = this.props.mt);
        window.App.add_su(ajax_query);
        fetchPolyfill(`api/${this.props.packId}/${this.props.actorId}?${queryString.stringify(ajax_query)}`).then(
            window.App.handleAjaxResponse
        ).then(data => {
            if (!data.success) {
                Object.assign(this.gridData, {
                    count: 0,
                    rows: [],
                });
            } else {
                Object.assign(this.gridData, {
                    count: data.count,
                    pv_values: this.props.inDetail ? {} : data.param_values,
                    rows: data.rows,
                    title: data.title,
                });
            }
            Object.assign(this.gridData, {
                data: data,
                loading: false,
                page: pass.page,
                query: pass.query,
                sortFieldName: pass.sortFieldName,
                sortOrder: pass.sortOrder,
                topRow: (pass.page) * this.gridData.rowsPerPage,
            });
            if (reload) this.setState({loading: false});
            this.gridData.fetching = "off";
        }).catch(window.App.handleAjaxException);
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
        this.get_data({}, true);
        window.addEventListener("resize", this.handleWindowChange);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.handleWindowChange);
    }

    handleWindowChange() {
        this.setState({show_top_toolbar: isMobile() ? false : true});
    }

    update_pv_values(values) {
        let old_pv_values = pvObj2array(this.gridData.pv_values, this.props.actorData.pv_fields),
            updated_pv = Object.assign({}, this.gridData.pv_values, {...values}),
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

    /*
    used in deteail slave tables if actordata."simple_slavegrid_header "
     */

    renderParamValueControls() {
        return this.props.actorData.pv_layout && <React.Fragment>
            <Button icon={"pi pi-filter"} onClick={this.showParamValueDialog}/>
            {
                Object.keys(this.state.pv || {}).length !== 0 &&
                <Button icon={"pi pi-times-circle"} onClick={() => this.reload({pv: {}})}/>
            }
        </React.Fragment>
    }

    renderToggle_colControls() {
        return this.state.toggle_col ?
            <MultiSelect value={this.gridData.show_columns} options={this.gridData.cols}
                         ref={(el) => this.show_col_selector = el}
                         onChange={(e) => {
                             this.gridData.component.cols = undefined;
                             clearTimeout(this.show_col_timeout);
                             this.show_col_selector.focusInput.focus();
                             setTimeout(() => (this.show_col_selector.dont_blur = false), 400);
                             this.show_col_selector.dont_blur = true;
                             this.gridData.show_columns = e.value;
                             this.setState({loading: false});
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
                this.setState({toggle_col: true});
                setTimeout(() => {
                        this.show_col_selector.focusInput.focus();
                        this.show_col_selector.show();
                    },
                    25
                )
            }}/>
    }

    renderDataViewLayout() {
        return <DataViewLayoutOptions
            onChange={e => {
                this.setState({layout: e.value});
                this.refresh();
            }}
            layout={this.state.layout}/>
    }

    renderExpandButton() {
        return <Button className="l-button-expand-grid p-button-secondary"
            onClick={this.expand}
            icon="pi pi-external-link"
            style={{
                width: "1.2em",
                height: "1.2em",
                padding: "unset",
                marginBottom: "2px"
            }}/>
    }

    renderQuickFilter(wide) {
        return <InputText className="l-grid-quickfilter"
                          style={{
                              width: wide ? "100%" : undefined,
                              marginRight: wide ? "1ch" : undefined,
                              marginLeft: wide ? "1ch" : undefined,
                          }}
                          placeholder="QuickSearch"
                          value={this.gridData.query}
                          onChange={(e) => {
                              this.gridData.query = e.target.value;
                              this.reload({query: e.target.value});
                          }}/>
    }

    renderActionBar() {
        return <div style={{"textAlign": "left"}}>
            <LinoBbar
                actorData={this.props.actorData}
                sr={this.state.selectedRows}
                reload={this.reload}
                srMap={(row) => row[this.props.actorData.pk_index]}
                rp={this} an={'grid'}
                runAction={this.runAction}/>
        </div>
    }

    renderSimpleHeader() {
        return <div>
            <div
                className="l-grid-header">{this.gridData.title || this.props.actorData.label}
                <div style={{float: "right", marginTop: "-.5ch"}}>
                    {this.renderExpandButton()}
                </div>
            </div>
            {this.renderProgressBar()}
        </div>
    }


    renderDetailHeader() {
        let {actorData} = this.props;

        if (this.props.actorData.simple_slavegrid_header) {
            return this.renderSimpleHeader();
        }

        return <React.Fragment>
            <div className="table-header">
                <div>{this.gridData.title || this.props.actorData.label} {this.renderExpandButton()}</div>
                {this.renderDataViewLayout()}

            </div>
            {this.renderProgressBar()}
        </React.Fragment>
    }

    renderMainGridHeader() {
        return <React.Fragment>
            {this.state.show_top_toolbar && <React.Fragment>
                <div className={"table-header"}>
                    <div>
                        {this.renderQuickFilter()}
                        {this.renderParamValueControls()}
                    </div>
                    <ToggleButton
                        className="data_view-toggle"
                        checked={true}
                        onChange={() => {
                            this.setState({data_view: false});
                            this.refresh({wt: "g"});
                        }}
                        onIcon="pi pi-table"
                        offIcon="pi pi-list"
                        onLabel=""
                        offLabel=""/>
                </div>
                <div className={"table-header"}>
                    {this.renderActionBar()}
                    {this.state.data_view && this.renderDataViewLayout()}
                </div>
            </React.Fragment>}
            <div className={"table-header"}>
                {this.renderProgressBar()}
            </div>
        </React.Fragment>
    }

    renderProgressBar() {
        return <ProgressBar mode="indeterminate" className={this.state.loading ? "" : "lino-transparent"}
                style={{height: '5px'}}/>
    }

    renderHeader() {
        return this.props.inDetail ? this.renderDetailHeader() : this.renderMainGridHeader()
    }

    renderPaginator() {
        if (this.props.actorData.preview_limit === 0 ||
            this.gridData.rows.length === 0 ||
            this.gridData.count < this.gridData.rowsPerPage) {
            return undefined
        } else if (this.props.actorData.simple_paginator) {
            return
        }

        return <Paginator
            rows={this.gridData.rowsPerPage}
            paginator={true}
            first={this.gridData.topRow}
            totalRecords={this.gridData.count}
            template={this.props.actorData.paginator_template || undefined}
            // paginatorLeft={paginatorLeft} paginatorRight={paginatorRight}
            // rowsPerPageOptions={[5, 10, 20]}
            onPageChange={(e) => {
                this.reload({page: e.page});
            }}
            rightContent={
                this.gridData.count && <span
                    className={"l-grid-count"}>Showing <Dropdown
                        style={{width: "80px"}}
                        value={this.gridData.rowsPerPage}
                        placeholder={this.gridData.rowsPerPage.toString()}
                        options={[25, 50, 100, 200, 400, 800]}
                        onChange={(e) => {
                            let value = parseInt(e.value)
                            this.gridData.rowsPerPage = value <= this.gridData.count ? value : this.gridData.count;
                            this.reload();
                        }}/>
                    <span> of {this.gridData.count}</span> rows
                </span>
            }
        />;
    }

    itemTemplate(rowData, layout) {
        const content = rowData.main_card_body ? <div dangerouslySetInnerHTML={{__html: rowData.main_card_body}}/> :
            <LinoLayout
                // window_layout={this.props.actorData.ba[this.props.actorData.detail_action].window_layout}
                window_layout={this.props.actorData.card_layout}
                data={rowData}
                actorId={this.get_full_id()}
                actorData={this.props.actorData}
                // disabled_fields={this.state.disabled_fields} // Todo
                // update_value={this.update_value}
                // editing_mode={this.state.data.disable_editing ? false : this.state.editing_mode} // keep detail as editing mode only for now, untill beautifying things/}

                // update_value={this.update_pv_values} //  Todo
                // in_grid={true} // false, true not working, due to fields_index being only set in cols.
                editing_mode={false} // keep detail as editing mode only for now, untill beautifying things/}
                pk={rowData["id"]}
                mk={this.props.mk}
                mt={this.props.actorData.content_type}
                depth={this.props.depth + 1}
                match={this.props.match}
                reload_timestamp={this.state.reload_timestamp}
                // title={this.state.title}
                // parent_pv={this.state.pv}
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
                title={rowData.card_title}
                style={{margin: "20px"}}>
                {content}
            </Card>
        }
    }

    renderMinimized() {

    }

    render() {
        if (this.props.actorData.hide_if_empty && this.props.inDetail && this.gridData.rows.length === 0) {
            return null
        }
        const header = this.renderHeader(),
            footer = this.renderPaginator();
        return <React.Fragment>
            <h1 className={"l-detail-header"}>
                <span dangerouslySetInnerHTML={{ __html:this.gridData.title || this.props.actorData.label || "\u00a0" }}></span>
                {!this.props.actorData.slave && <ToggleButton
                    style={{'float': 'right'}}
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
                {((!this.state.loading) && (!this.state.data_view))/*|| this.props.actorData.card_layout === undefined)*/?
                    <LinoDTable
                        {...this.props}
                        count={this.gridData.count}
                        disabled_fields={this.state.disabled_fields}
                        fetching={this.gridData.fetching}
                        linoGrid={this}
                        loading={this.gridData.loading}
                        onRowDoubleClick={this.onRowDoubleClick}
                        onSort={this.onSort}
                        pv={this.state.pv}
                        refresh={this.refresh}
                        rows={this.gridData.rows}
                        rowsPerPage={this.gridData.rowsPerPage}
                        show_top_toolbar={this.state.show_top_toolbar}
                        showParamValueDialog={this.showParamValueDialog}
                        sortField={this.gridData.sortField}
                        sortOrder={this.gridData.sortOrder}
                        topRow={this.gridData.topRow}/>
                    : this.props.actorData.borderless_list_mode ?
                        <div>
                            {this.gridData.rows.map((row, index) => (
                                <div key={this.gridData.rows[index][this.props.actorData.pk_index]}>{this.itemTemplate(row)}</div>
                            ))}
                        </div>
                        : <DataView
                            value={this.gridData.rows}
                            header={header}
                            footer={footer}
                            layout={this.state.layout}
                            itemTemplate={this.itemTemplate}
                            itemKey={(data, index) => (this.gridData.rows[index].id)}/>}
            </div>
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
                    data={this.gridData.pv_values}
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
