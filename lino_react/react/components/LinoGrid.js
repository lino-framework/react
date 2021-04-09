import React, {Component} from "react";
import PropTypes from "prop-types";

import queryString from 'query-string';
import key from "weak-key";
import {fetch as fetchPolyfill} from 'whatwg-fetch' // fills fetch

import {DataTable} from 'primereact/datatable';
import {DataView, DataViewLayoutOptions} from 'primereact/dataview';
import {Column} from 'primereact/column';
import {Paginator} from 'primereact/paginator';
import {Button} from 'primereact/button';
import {InputText} from 'primereact/inputtext';
import {Dropdown} from 'primereact/dropdown';
import {MultiSelect} from 'primereact/multiselect';
import {Dialog} from 'primereact/dialog';
import {Panel} from 'primereact/panel';
import {ProgressBar} from 'primereact/progressbar';
import {ToggleButton} from 'primereact/togglebutton';

import {debounce, pvObj2array, isMobile, find_cellIndex, gridList2Obj} from "./LinoUtils";

import LinoLayout from "./LinoComponents";
import LinoBbar from "./LinoBbar";


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

            display_mode: this.props.display_mode || props.actorData && props.actorData.display_mode && props.actorData.display_mode !== "summary" && props.actorData.display_mode || "grid",

            sortField: undefined, // Sort data index   (used in PR)
            sortFieldName: undefined, // Sort col.name (used in Lino)
            // sortOrder: undefined

            sortOrder: search['sortOrder'] ? search['sortOrder'] : undefined,
            sortCol: search['sortField'] ? this.props.actorData.col.find((col) => String(col.fields_index) === search['sortField']) : undefined,

            show_top_toolbar: isMobile() ? false : true,
        };
        // Move data that does not require render() call from this.state to this.gridData
        this.gridData = {
            editingValues: {},
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
        this.onEditorInit = this.onEditorInit.bind(this);
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

    /**
     * Template function generator for grid data.
     * Looks up the correct template and passes in correct data.
     * @param col : json Lino site data, the col value.
     */

    columnTemplate(col) {
        return (rowData, column) => {
            let pk = rowData[this.props.actorData.pk_index];
            let cellIndex = column.cellIndex;
            let {editingCellIndex, editingPK} = this.state;
            // let editing = pk == editingPK && cellIndex == editingCellIndex;
            const prop_bundle = {
                actorId: this.get_full_id(),
                actorData: this.props.actorData,
                data: (pk === null && this.state.editingPK === null) ? this.gridData.editingValues : rowData,
                disabled_fields: this.state.disabled_fields || [],
                update_value: this.update_col_value, // No editable yet
                editing_mode: false,
                hide_label: true,
                in_grid: true,
                column: column,
                match: this.props.match,
                container: this.dataTable && this.dataTable.table,
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
        if (!col.editable) return undefined;
        return (column) => {
            const prop_bundle = {
                onKeyDown: this.onKeyDown,
                actorId: this.get_full_id(),
                data: column.rowData || this.gridData.editingValues,
                actorData: this.props.actorData,
                disabled_fields: this.state.disabled_fields || [],
                update_value: this.update_col_value,
                hide_label: true,
                in_grid: true,
                container: this.dataTable && this.dataTable.table,
                column: column,
                editing_mode: true,
                match: this.props.match,
                mk: this.props.mk,
                mt: this.props.mt,
            };
            return <div
                onKeyDown={(event) => {
                    let el = event.target,
                        tr = el.closest("tr");
                    if (event.key === "Enter") {
                        tr = event.shiftKey ? tr.previousSibling :
                            tr.nextSibling;
                        let cellIndex = Array.prototype.indexOf.call(event.target.closest("tr").childNodes, event.target.closest("td"));

                        if (tr) { //might be end of table
                            tr.children[cellIndex].getElementsByClassName("p-cell-editor-key-helper")[0].focus()
                            // if (helper.length) {
                            //     helper[0].focus()
                        }
                    }
                    if (event.key === "Tab") {
                        let tbl = el.closest("table");
                        // bad logic, should just find all of that class, find the one containing self, and + / - 1 and focus.
                        let cols = Array.prototype(...tbl.getElementsByClassName("p-cell-editor-key-helper")),
                            i = cols.findIndex((n) => n.parentElement.contains(el));
                        i = event.shiftKey ? i - 1 : i + 1;
                        // if (i === cols.length || i < 0) { // if out of index range of cols
                        // Gotta goto next tr..
                        // tr = event.shiftKey ? tr.previousSibling :
                        //                       tr.nextSibling;
                        // cols = Array(...tr.getElementsByClassName("p-cell-editor-key-helper"));
                        // i = i < 0 ? cols.length-1 : 0; // last or first col.
                        // }
                        cols[i].focus() // Open next / prev editor
                    }
                }}>
                <LinoLayout {...prop_bundle} elem={col}/>
            </div>
        }
    }

    onCancel(cellProps) {
        console.log("onCancel");
    }

    onSubmit(cellProps, event, bodyCell) {
        let {rowData, field, rowIndex} = cellProps.columnProps;
        let editingPK = this.state.editingPK;
        if (!this.editorDirty) {
            return
        }
        this.state.editingValues = this.gridData.editingValues;

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
                    data.rows && this.setState((old) => { // update just the row
                        let state = {},
                            rows = old.rows.slice(); // make data copy
                        state.rows = rows;
                        // What is a phantom row? And why do we need it?
                        // if (editingPK === null) {
                        //     rows.push(rows[rowIndex].slice()); // create copy phantom row
                        //     state.editingPK = undefined;
                        //     this.gridData.editingPK = undefined;
                        //     if (openNextCell) {
                        //         this.editPhantomRowAgain = setTimeout(() => {
                        //             //TODO open phantom row
                        //             document.gridEntertd.parentElement.nextSibling.children[document.gridTdIndex].click();
                        //             // console.log("Try go find and start editing cell", target, tr)
                        //         }, 200)
                        //     }
                        // } else
                        if (this.state.editingPK === data.rows[0][this.props.actorData.pk_index]) {
                            state.editingValues = Object.assign({}, {...data.rows[0]}); // update editing values
                            this.gridData.editingValues = state.editingValues;
                        }
                        rows[rowIndex] = data.rows[0];
                        return state
                    })
                }
            })
        };

        if (editingPK === null) {

            if (document.gridEnterPress) {
                submit(!document.gridShiftPress); // !document.gridShiftPress Not implemented

            } else {
                this.phantomSubmit = setTimeout(() => {
                    // console.log("on submit timeout");

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
        } else {
            submit()
        }
    }

    onEditorInit(e) {
        let {rowData, field} = e.columnProps;
        let was_dirty = this.editorDirty;
        let boolField = document.boolFieldClick; // undefined for now. Boolfield should set it
        this.editorDirty = false;
        this.setState((old) => {
            // console.log('old',old);
            let editingPK, editingValues = {};

            if (old.editingPK === null && rowData[this.props.actorData.pk_index] === old.editingPK && was_dirty) {
                console.warn("Your assumption was wrong!");
            //     this.editorDirty = true; // we have old values so still dirty.
            //     clearTimeout(this.phantomSubmit);
            }
            // else
            if (rowData[this.props.actorData.pk_index] === null) {
                if (boolField) {
                    this.editorDirty = true;
                    editingValues[field] = true
                }
                this.gridData.editingValues = editingValues;
                return {
                    editingPK: null, // start editing a phantom with empty values not null values.
                    editingValues: editingValues
                }
            } else {
                if (boolField) {
                    // When we edit BooleanFieldElement field we change its value
                    this.editorDirty = true; // Make the editor dirty as we want to edit on first click
                    this.gridData.editingValues = {[field]: !rowData[field]};
                    return {
                        editingPK: rowData[this.props.actorData.pk_index],
                        editingValues: {[field]: !rowData[field]}
                    }
                }
                this.gridData.editingValues = Object.assign({}, {...rowData});
                return {
                    // editingCellIndex:cellIndex,
                    editingPK: rowData[this.props.actorData.pk_index], // used when getting return data from row save, in that case, we set new data as editingValues
                    editingValues: Object.assign({}, {...rowData}) // made copy of all row data
                }
            }

        })
    }

    onSort(e) {
        let {sortField, sortOrder} = e,
            col = this.props.actorData.col.find((col) => String(col.fields_index) === sortField);
        this.reload({sortCol: col, sortOrder: sortOrder})
    }

    update_col_value(v, elem, col) {
        this.editorDirty = true;
        this.gridData.editingValues = Object.assign({}, {...v});
            this.setState((old => {
        //         // Object.assign(state.rows[col.rowIndex],{...v});
        //
                if (old.editingPK === null && col.rowData[this.props.actorData.pk_index] === old.editingPK) {
        //             // editingPK cannot have any value when it is null, so the above comparison in invalid
        //             // hance this block of code will never execute and unnecessary.
                    console.warn("Your assumption was wrong!");
        //             // this.gridData.editingValues = Object.assign({}, {...this.state.editingValues}, {...v});
        //             // return {
        //             //     editingValues: Object.assign({}, {...this.state.editingValues}, {...v})
        //             // }
                }
        //         this.gridData.editingValues = Object.assign({}, {...v});
        //         return {
        //             editingValues: Object.assign({}, {...v})
        //         }
            }));
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
        // console.log("20210216 onRowSelect", originalEvent, data, type);
        // let cellIndex = find_cellIndex(originalEvent.target);
        // First thing is to determine which cell was selected, as opposed to row.
        originalEvent.stopPropagation(); // Prevents multiple fires when selecting checkbox.

        if (type === "checkbox" || type === "radio") {
            return // We only want selection, no nav.
        }
    }

    onRowDoubleClick({originalEvent, data, type}) {
        // console.log("20210216 onRowDoubleClick", this.props.actorData.pk_index, data);
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
        this.setState({showPVDialog: true});
    }

    quickFilter(query) {
        // in own method so we can use it as a debouce
        this.setState({query: query});
        this.reload({query: query});
//        this.log(query);
    }

    update_url_values(vals, router) {
        let search = queryString.parse(router.history.location.search);
        Object.assign({}, search, {...vals});
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
        } else {
            page = this.state.page;
        }

        this.update_url_values({[`${this.props.inDetail ? this.get_full_id() + "." : ""}page`]: page + 1}, this.props.match);

        let ajax_query = {
            fmt: "json",
            limit: this.state.rowsPerPage,
            start: page * this.state.rowsPerPage, // Needed due to race condition when setting-state
            query: query !== undefined ? query : this.state.query, // use given query or state-query
            rp: this.rp,
            wt: this.state.display_mode === "grid" ? "g" : "c"
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
            sortFieldName = this.state.sortFieldName;
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
        } else if (this.props.actorData.pv_layout) {
            let search = queryString.parse(this.props.match.history.location.search);
            // use either, pv passed with reload method, current state, or failing all, in url
            if (!this.props.inDetail && pv === undefined && Object.keys(this.state.pv_values).length === 0) {
                ajax_query.pv = search.pv
            } else if (Object.keys(this.state.pv_values).length !== 0) { // only apply when there's some data there to insure getting of default values form server
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

        fetchPolyfill(`api/${this.props.packId}/${this.props.actorId}?${queryString.stringify(ajax_query)}`).then(
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
                        // objRows: rows.map(r => gridList2Obj(this.props.actorData, r)),
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
        // console.log("20210223 componentDidMount()")
        this.cols = undefined;
        document.addEventListener("keydown", this.handelKeydown, false);
        this.reload();
        window.addEventListener("resize", this.handleWindowChange);
        // console.log(this.props.actorId, "LinoGrid ComponentMount", this.props);
    }

    componentWillUnmount() {
        // console.log("20210223 componentWillUnmount()")
        document.removeEventListener("keydown", this.handelKeydown, false);
        window.removeEventListener("resize", this.handleWindowChange);
    }

    handleWindowChange() {
        this.setState({show_top_toolbar: isMobile() ? false : true});
    }

    handelKeydown(event) {
        // switch (event.key) {
        //     case "Escape":
        //         // cancel editing, close editor and clear editing values.
        //         // this.dataTable.closeEditingCell(); // Doesn't exist in local version,
        //         document.body.click(); // What closeEditingCell actually does.
        //         this.setState({editingValues: {}});
        //         ;
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
            let updated_pv = Object.assign({}, prevState.pv_values, {...values});
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
                    col === "SelectCol" ?
                        <Column selectionMode="multiple"
                            style={{
                                width: '2em',
                                "padding": "unset",
                                "textAlign": "center"
                            }}
                            // editor={this.columnEditor(col)}

                        /> :
                        <Column
                            cellIndex={i}
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
                            onEditorInit={this.onEditorInit}
                            // validaterEvent={"blur"}
                            isDisabled={
                                (props) => (props.rowData[props.rowData.length - 1] ||
                                    (props.rowData[props.rowData.length - 2]
                                        && //if null / phantom row / not disabled
                                        Object.keys(props.rowData[props.rowData.length - 2]).find(
                                            (e) => e === props.col.name
                                        )
                                    )
                                )
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

    /*
    used in deteail slave tables if actordata."simple_slavegrid_header "
     */

    renderParamValueControls() {
        return this.props.actorData.pv_layout && <React.Fragment>
            <Button icon={"pi pi-filter"} onClick={this.showParamValueDialog}/>
            {Object.keys(this.state.pv || {}).length !== 0 &&
            <Button icon={"pi pi-times-circle"} onClick={() => this.reload({pv: {}})}/>}
        </React.Fragment>

    }

    renderToggle_colControls() {
        return this.state.toggle_col ?
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
            }}/>
    }

    renderDataViewLayout() {
        return <DataViewLayoutOptions
            style={{marginTop: "5px"}}
            layoutChoices={["grid", "list", "cards"]}
            layoutIcons={["pi-table", "pi-bars", "pi-th-large"]}
            onChange={e => {
                this.setState({display_mode: e.value, rows: []});
                this.reload()
            }}
            layout={this.state.display_mode}
        />
    }

    renderExpandButton() {
        return <Button className="l-button-expand-grid p-button-secondary" onClick={this.expand}
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
                          value={this.state.query}
                          onChange={(e) => this.quickFilter(e.target.value)}/>
    }

    renderActionBar() {
        return <div style={{"textAlign": "left"}}>
            <LinoBbar actorData={this.props.actorData} sr={this.state.selectedRows} reload={this.reload}
                      srMap={(row) => row[this.props.actorData.pk_index]}
                      rp={this} an={'grid'}
                      runAction={this.runAction}/>

        </div>
    }

    renderSimpleHeader() {
        return <div>
            <div
                className="l-grid-header">{this.state.title || this.props.actorData.label}
                <div style={{float: "right", marginTop: "-.5ch"}}>
                    {this.renderExpandButton()}
                </div>
            </div>
            {this.renderProgressBar()}
        </div>
    }


    renderDetailHeader() {
        // let mobile = isMobile();
        let {actorData} = this.props;

        if (this.props.actorData.simple_slavegrid_header) {
            return this.renderSimpleHeader();
        }

        return <React.Fragment>
            <div className="table-header">
                <div>{this.state.title || this.props.actorData.label} {this.renderExpandButton()}</div>
                {this.renderDataViewLayout()}

            </div>
            {this.renderProgressBar()}
        </React.Fragment>
    }

    renderMainGridHeader() {
        let {actorData} = this.props;
        return this.state.show_top_toolbar && <React.Fragment>
            <div className={"table-header"}>
                <div>
                    {this.renderQuickFilter()}
                    {this.renderParamValueControls()}
                    {this.renderToggle_colControls()}
                </div>
            </div>
            <div className={"table-header"}>
                {this.renderActionBar()}
                {this.renderProgressBar()}
                {this.renderDataViewLayout()}
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
            this.state.rows.length === 0 ||
            this.state.rows.length < this.state.rowsPerPage) {
            return undefined
        } else if (this.props.actorData.simple_paginator) {
            return
        }

        return <Paginator
            rows={this.state.rowsPerPage}
            paginator={true}
            first={this.state.topRow}
            totalRecords={this.state.totalRecords}
            template={this.props.actorData.paginator_template || undefined}
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


    itemTemplate(rowData) {
        return <Panel className={"l-itemTemplate"}
                      header={<div dangerouslySetInnerHTML={{__html: rowData.card_title}}/>} toggleable={true}>
            {rowData.main_card_body ? <div dangerouslySetInnerHTML={{__html: rowData.main_card_body}}/> :
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
                />}
        </Panel>
    }

    renderMinimized() {

    }


    render() {
        if (this.props.actorData.hide_if_empty && this.props.inDetail && this.state.rows.length === 0) {
            return null
        }
        const header = this.renderHeader(),
            footer = this.renderPaginator();
        return <React.Fragment>
            <h1 className={"l-detail-header"}>
                <span dangerouslySetInnerHTML={{ __html:this.state.title || this.props.actorData.label || "\u00a0" }}></span>
                {!this.props.actorData.slave && <ToggleButton
                    style={{'float': 'right'}}
                    checked={this.state.show_top_toolbar}
                    onChange={e => this.setState({
                        show_top_toolbar: !this.state.show_top_toolbar
                    })}
                    onLabel=''
                    offLabel=''
                    onIcon='pi pi-bars'
                    offIcon='pi pi-bars'
                    iconPos="right"
                />}
            </h1>
            <div className={"l-grid"} >
                {this.state.display_mode === "grid" || this.props.actorData.card_layout === undefined ?
                    <DataTable
                        reorderableColumns={true}
                        header={header}
                        footer={footer}
                        responsive={this.props.actorData.react_responsive}
                        resizableColumns={true}
                        value={this.state.rows}
                        paginator={false}
                        // selectionMode="single"
                        editable={true}
                        // selectionMode={this.props.actorData.hide_top_toolbar ? "single" : "multiple" } // causes row selection
                        selectionMode={this.props.actorData.editable ? undefined : "multiple"} // causes row selection
                        onSelectionChange={(e) => {
                            this.setState({selectedRows: e.value});
                        }}
                        onColReorder={e => this.onColReorder({event: e.columns})}
                        onRowSelect={this.onRowSelect}
                        selection={this.props.actorData.hide_top_toolbar ? undefined : this.state.selectedRows}
                        loading={this.state.loading}
                        // emptyMessage={this.state.emptyMessage} // this.state.emptyMessage is not defined.
                        ref={(ref) => this.dataTable = ref}
                        onRowDoubleClick={this.onRowDoubleClick}
                        onSort={this.onSort}
                        // sortMode={"multiple"} No editable yet
                        // multiSortMeta={multiSortMeta}
                        sortField={this.state.sortField + ""}
                        sortOrder={this.state.sortOrder}
                        lazy={true}
                    >
                        {this.get_cols()}
                    </DataTable>
                    :
                    this.props.actorData.borderless_list_mode ?
                        <div>
                            {this.state.rows.map((row, index) => (
                                <div key={this.state.rows[index][this.props.actorData.pk_index]}>{this.itemTemplate(row)}</div>
                            ))}
                        </div>
                        :
                        <DataView value={this.state.rows}
                                  header={header}
                                  footer={footer}
                                  layout={this.state.display_mode === "cards" ? "grid" : "list"} // convert cards to grid (PR value)
                                  itemTemplate={this.itemTemplate}
                                  itemKey={(data, index) => (this.state.rows[index][this.props.actorData.pk_index])}
                        />}
            </div>
            {this.props.actorData.pv_layout && this.state.showPVDialog &&
            <Dialog header="Filter Parameters"
                    footer={<div>
                        <Button style={{width: "33px"}} icon={"pi pi-times-circle"}
                                onClick={() => this.reload({pv: {}})}/>
                        <Button
                            style={{width: "33px"}}
                            icon={"pi pi-check"}
                            onClick={(e) => {
                                this.setState({showPVDialog: false});
                            }}/>
                    </div>}
                    visible={this.state.showPVDialog} modal={true}
                    onHide={(e) => this.setState({showPVDialog: false})}>

                {this.props.actorData.pv_layout && this.state.showPVDialog &&
                <LinoLayout
                    window_layout={this.props.actorData.pv_layout}
                    window_type={"p"} // param value layout, used for blank filter val
                    actorData={this.props.actorData}
                    data={this.state.pv_values}
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
