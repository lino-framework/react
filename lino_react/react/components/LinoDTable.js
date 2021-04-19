import React from 'react';

import _ from "lodash";
import PropTypes from "prop-types";

import {Button} from 'primereact/button';
import {Column} from 'primereact/column';
import {DataTable} from 'primereact/datatable';
import {Dropdown} from 'primereact/dropdown';
import {InputText} from 'primereact/inputtext';
import {MultiSelect} from 'primereact/multiselect';
import {Paginator} from 'primereact/paginator';
import {ProgressBar} from 'primereact/progressbar';
import {ToggleButton} from 'primereact/togglebutton';

import LinoBbar from "./LinoBbar";
import LinoLayout from "./LinoComponents";

export default class LinoDTable extends React.Component {
    get_full_id() {
        return `${this.props.packId}.${this.props.actorId}`
    }

    constructor(props) {
        super(props);
        this.state = {
            toggle_col: false,
            selectedRows: [],
        };
        this.component = {};
        this.data = {
            editingCellIndex: undefined,
            editingCol: undefined,
            editingPK: undefined,
            editingValues: {},
            query: "",
            rows: props.rows,
        };
        this.component.show_columns = props.actorData.col.filter((col) => !col.hidden).map((col) => col.fields_index);
        this.columnEditor = this.columnEditor.bind(this);
        this.columnTemplate = this.columnTemplate.bind(this);
        this.demandsFromChildren = this.demandsFromChildren.bind(this);
        this.onBeforeEditorHide = this.onBeforeEditorHide.bind(this);
        this.onBeforeEditorShow = this.onBeforeEditorShow.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.onColReorder = this.onColReorder.bind(this);
        this.onEditorInit = this.onEditorInit.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.set_cols = this.set_cols.bind(this);
        this.update_col_value = this.update_col_value.bind(this);

        this.set_cols();
    }

    shouldComponentUpdate(nextProps) {
        if (nextProps.fetching === "on" || (!_.isEqual(nextProps, this.props))) {
            return true
        }
        return false
    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
        if (!_.isEqual(prevProps.rows, this.props.rows)) {
            return "newValue"
        }
        return null
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (snapshot === "newValue") {
            this.data.rows = this.props.rows;
            this.setState({loading: false});
        }
    }

    // To pass arbitrary objects to childrens on demand
    demandsFromChildren(obj) {
        this.data.roger = obj;
    }

    onColReorder(e) {
        this.component.columns = e.columns;
        this.component.show_columns = e.columns.map((col) => parseInt(col.props.field));
        this.setState({loading: false});
    }

    onBeforeEditorHide(col) {
        if (this.data.editorDirty) {
            this.onSubmit(col, true);
        }
    }

    onBeforeEditorShow(col) {
    }

    onEditorInit(e) {
        this.data.editorDirty = false;
        this.data.editingCol = e;
        this.data.editingPK = e.columnProps.rowData[this.props.actorData.pk_index];
        this.data.editingValues = Object.assign({}, {...e.columnProps.rowData});
        this.data.editingCellIndex = e.columnProps.cellIndex;
        if (this.data.roger !== undefined) delete this.data.roger;
    }

    update_col_value(v, elem, col) {
        (!this.data.editorDirty) && (this.data.editorDirty = true);
        this.data.editingValues = Object.assign({}, {...v});
        this.data.editingCol = col;
    }

    onSubmit(cellProps, explicit_call) {
        let {rowData, field, rowIndex} = cellProps.columnProps;
        let editingPK = this.data.editingPK;
        if ((!this.data.editorDirty)) {
            return
        }
        window.App.runAction({
            rp: this,
            an: editingPK === null ? "grid_post" : "grid_put",
            actorId: `${this.props.packId}.${this.props.actorId}`,
            sr: editingPK === null ? undefined : editingPK,
            status: {
                base_params: {mk: this.props.mk, mt: this.props.mt}
            },
            response_callback: (data) => {
                if (data.rows !== undefined) {
                    this.data.rows[rowIndex] = data.rows[0];
                    this.props.linoGrid.gridData.rows[rowIndex] = data.rows[0];
                    this.data.editorDirty = false;
                    if (!explicit_call) this.setState({loading: false});
                }
            }
        });
        this.data.editorDirty = false;
        if (explicit_call) {
            this.props.refresh();
        } else {
            this.setState({loading: false});
        }
    }

    onCancel() {
        console.log('Cancelled!')
    }

    columnEditor(col) {
        if (!col.editable) return undefined;
        return (column) => {
            const prop_bundle = {
                actorId: this.get_full_id(),
                data: column.rowData,
                actorData: this.props.actorData,
                disabled_fields: this.props.disabled_fields || [],
                update_value: this.update_col_value,
                hide_label: true,
                in_grid: true,
                container: this.dataTable && this.dataTable.table,
                column: column,
                editing_mode: true,
                match: this.props.match,
                mk: this.props.mk,
                mt: this.props.mt,
                refresh: this.props.refresh,
                ...this.data.roger,
            };
            return <div
                onKeyDown={(event) => {
                    if (event.target.className !== "ql-editor") {
                        let el = event.target,
                            tr = el.closest("tr");
                        if (event.key === "Enter") {
                            tr = event.shiftKey ? tr.previousSibling :
                                tr.nextSibling;
                            let cellIndex = Array.prototype.indexOf.call(event.target.closest("tr").childNodes, event.target.closest("td"));

                            if (tr) {
                                tr.children[cellIndex].getElementsByClassName("p-cell-editor-key-helper")[0].focus()
                            }
                        }
                        if (event.key === "Tab") {
                            let tbl = el.closest("table");
                            let cols = Array.prototype(...tbl.getElementsByClassName("p-cell-editor-key-helper")),
                                i = cols.findIndex((n) => n.parentElement.contains(el));
                            i = event.shiftKey ? i - 1 : i + 1;
                            cols[i].focus()
                        }
                    }
                }}>
                <LinoLayout {...prop_bundle} elem={col}/>
            </div>
        }
    }

    columnTemplate(col) {
        return (rowData, column) => {
            const prop_bundle = {
                actorId: this.get_full_id(),
                actorData: this.props.actorData,
                data: rowData,
                disabled_fields: this.props.disabled_fields || [],
                update_value: this.update_col_value,
                editing_mode: false,
                hide_label: true,
                in_grid: true,
                column: column,
                match: this.props.match,
                container: this.dataTable && this.dataTable.table,
                mk: this.props.mk,
                mt: this.props.mt,
                pass_roger: this.demandsFromChildren,
                refresh: this.props.refresh,
            };
            return <LinoLayout {...prop_bundle} elem={col}/>;
        }
    }

    set_cols() {
        if (this.component.columns === undefined) {
            this.component.columns = this.props.actorData.preview_limit === 0 ? [] : ["SelectCol"];
            this.component.columns = this.component.columns.concat(
                this.props.actorData.col.filter((col) => this.component.show_columns.includes(col.fields_index))
            ).map((col, i) => (
                    col === "SelectCol" ?
                        <Column
                            field="SelectCol"
                            key={i}
                            selectionMode="multiple"
                            style={{
                                width: '2em',
                                "padding": "unset",
                                "textAlign": "center"
                            }}/>
                        : <Column
                            cellIndex={i}
                            field={String(col.fields_index)}
                            body={this.columnTemplate(col)}
                            editor={this.columnEditor(col)}
                            header={col.label}
                            key={i}
                            col={col}
                            style={{width: `${(col.width || col.preferred_width) /*/ total_widths * 100*/}ch`}}
                            className={`l-grid-col l-grid-col-${col.name} ${
                                this.data.editingCellIndex === i ? 'p-cell-editing' : ''
                            }`}
                            onBeforeEditorHide={this.onBeforeEditorHide}
                            onBeforeEditorShow={this.onBeforeEditorShow}
                            onEditorCancel={this.onCancel}
                            onEditorSubmit={this.onSubmit}
                            onEditorInit={this.onEditorInit}
                            sortable={true}
                        />
                )
            )
        }
    }

    renderQuickFilter(wide) {
        return <InputText className="l-grid-quickfilter"
                          style={{
                              width: wide ? "100%" : undefined,
                              marginRight: wide ? "1ch" : undefined,
                              marginLeft: wide ? "1ch" : undefined,
                          }}
                          placeholder="QuickSearch"
                          value={this.data.query}
                          onChange={(e) => {
                              this.data.query = e.target.value;
                              this.props.refresh({query: e.target.value});
                          }}/>
    }

    // needs work!
    renderParamValueControls() {
        return this.props.actorData.pv_layout && <React.Fragment>
            <Button icon={"pi pi-filter"} onClick={this.props.showParamValueDialog}/>
            {
                Object.keys(this.props.pv || {}).length !== 0 &&
                <Button icon={"pi pi-times-circle"} onClick={() => this.props.refresh({pv: {}})}/>
            }
        </React.Fragment>
    }

    renderToggle_colControls() {
        return <React.Fragment>
            <span style={{position: "relative"}} ref={ref => this.toggleCol = ref}>
                <Button
                    icon={"pi pi-list"}
                    onClick={() => {
                        this.setState({toggle_col: true});
                        this.show_col_selector.show();
                    }}/>
                <span hidden={true}>
                    <MultiSelect
                        appendTo={this.toggleCol}
                        panelStyle={{zIndex: "99999", height: "auto", width: "auto", position: "absolute"}}
                        value={this.component.show_columns}
                        options={this.props.actorData.col.map((col) => {return {label: col.label, value: col.fields_index}})}
                        ref={(el) => this.show_col_selector = el}
                        onChange={(e) => {
                            this.component.columns = undefined;
                            this.component.show_columns = e.value;
                            this.set_cols();
                            this.setState({loading: false});
                        }}
                        onBlur={e => this.setState({toggle_col: false})}/>
                </span>
            </span>
        </React.Fragment>
    }

    renderActionBar() {
        return <div style={{"textAlign": "left"}}>
            <LinoBbar
                actorData={this.props.actorData}
                sr={this.state.selectedRows}
                reload={this.props.refresh}
                srMap={(row) => row[this.props.actorData.pk_index]}
                // rp={this.props.linoGrid}
                rp={this}
                an={'grid'}
                runAction={window.App.runAction}
                />
        </div>
    }

    renderProgressBar() {
        return <ProgressBar mode="indeterminate" className={this.props.loading ? "" : "lino-transparent"}
                style={{height: '5px'}}/>
    }

    renderMainGridHeader() {
        return <React.Fragment>
            {this.props.show_top_toolbar && <React.Fragment>
                <div className={"table-header"}>
                    <div>
                        {this.renderQuickFilter()}
                        {this.renderParamValueControls()}
                        {this.renderToggle_colControls()}
                    </div>
                    {this.props.actorData.card_layout && <ToggleButton
                        className="data_view-toggle"
                        checked={false}
                        onChange={(e) => {
                            this.props.linoGrid.setState({data_view: true});
                            this.props.refresh({wt: "c"});
                        }}
                        onIcon="pi pi-table"
                        offIcon="pi pi-list"
                        onLabel=""
                        offLabel=""/>}
                </div>
                <div className={"table-header"}>
                    {this.renderActionBar()}
                </div>
            </React.Fragment>}
            <div className={"table-header"}>
                {this.renderProgressBar()}
            </div>
        </React.Fragment>
    }

    renderPaginator() {
        if (this.props.actorData.preview_limit === 0 ||
            this.data.rows.length === 0 ||
            this.props.count < this.props.rowsPerPage) {
            return undefined
        } else if (this.props.actorData.simple_paginator) {
            return
        }

        return <Paginator
            rows={this.props.rowsPerPage}
            paginator={true}
            first={this.props.topRow}
            totalRecords={this.props.count}
            template={this.props.actorData.paginator_template || undefined}
            onPageChange={(e) => {
                this.props.refresh({page: e.page});
            }}
            rightContent={
                this.props.count && <span
                    className={"l-grid-count"}>Showing <Dropdown
                        style={{width: "80px"}}
                        value={this.props.rowsPerPage}
                        placeholder={this.props.rowsPerPage.toString()}
                        options={[25, 50, 100, 200, 400, 800]}
                        onChange={(e) => {
                            let value = parseInt(e.value)
                            this.props.linoGrid.gridData.rowsPerPage = value <= this.props.count ? value : this.props.count;
                            this.props.refresh();
                        }}/>
                    <span> of {this.props.count}</span> rows
                </span>
            }
        />;
    }

    render() {
        return <DataTable
            reorderableColumns={true}
            header={this.renderMainGridHeader()}
            footer={this.renderPaginator()}
            responsive={this.props.actorData.react_responsive}
            resizableColumns={true}
            value={this.data.rows}
            paginator={false}
            editable={true}
            selectionMode={this.props.actorData.editable ? undefined : "multiple"}
            onSelectionChange={(e) => {
                this.setState({selectedRows: e.value});
            }}
            onColReorder={this.onColReorder}
            selection={this.props.actorData.hide_top_toolbar ? undefined : this.state.selectedRows}
            loading={this.props.loading}
            ref={(ref) => this.dataTable = ref}
            onRowDoubleClick={this.props.onRowDoubleClick}
            onSort={this.props.onSort}
            sortField={this.props.sortField}
            sortOrder={this.props.sortOrder}
            lazy={true}>
            {this.component.columns}
        </DataTable>
    }
}
