import React, {Component} from "react";
import PropTypes from "prop-types";

import queryString from 'query-string';

import key from "weak-key";
import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {Paginator} from 'primereact/paginator';
import LinoComponents from "./LinoComponents";

export class LinoGrid extends Component {

    static propTypes = {
        match: PropTypes.object,
        actorId: PropTypes.string,
        packId: PropTypes.string,
        actorData: PropTypes.object,
	    mt: PropTypes.int,
	    mk: PropTypes.any // we want to allow str / slug pks
	// todo: in_detail : PropTypes.bool
    };
    static defaultProps = {};

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

	    
        };
        this.reload = this.reload.bind(this);
        this.onRowSelect = this.onRowSelect.bind(this);
        this.columnTemplate = this.columnTemplate.bind(this);


    }

    /**
     * Template function generator for grid data.
     * Looks up the correct template and passes in correct data.
     * @param col : json Lino site data, the col value.
     */
    columnTemplate(col) {
        console.log(col);
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
            };
            prop_bundle.prop_bundle = prop_bundle;
            return <Template {...prop_bundle} elem={col}/>;
        }
    }

    onRowSelect(e) {
        this.props.match.history.push(
            `/api/${this.props.packId}/${this.props.actorId}/${e.data[this.props.actorData.pk_index]}`);
        console.log(e.data);
    }


    reload({page = undefined} = {}) {
        this.setState({
            data: null,
            rows: []
        });

        let query = {
            fmt: "json",
            limit: this.state.rowsPerPage,
            start: (page || this.state.page) * this.state.rowsPerPage // Needed due to race condition when setting-state
            // todo pv
            //
        };

        if (this.props.mk){
            query.mk = this.props.mk;
        }
        if (this.props.mt){
            query.mt = this.props.mt;
        }

        console.log("table pre-GET", query, this.state);

        fetch(`/api/${this.props.packId}/${this.props.actorId}` + `?${queryString.stringify(query)}`).then(
            (res) => (res.json())
        ).then(
            (data) => {
                console.log("table GET", data);
                let rows = data.rows;
                delete data.rows;
                this.setState({
                    data: data,
                    rows: rows,
                    totalRecords: data.count,
                    topRow: (page || this.state.page) * this.state.rowsPerPage,
		    // beware race conditions
		    // pv: data.paramValues
                });
            }
        )
    }

    componentDidMount() {
        this.reload();
        console.log(this.props.actorId, "LinoGrid ComponentMount", this.props);
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


        return <div>
            <DataTable
                footer={paginator}
                responsive={true}
                resizableColumns={true}
                value={rows} paginator={false} selectionMode="single"
                onSelectionChange={e => this.setState({selectedRow: e.value})}
                onRowSelect={this.onRowSelect}
                loading={this.state.data === null}
            >
                {this.props.actorData.col.filter((col) => !col.hidden || this.state.show_columns[col.name]).map((col, i) => (
                        <Column field={String(col.fields_index)}
                                body={this.columnTemplate(col)}
                                header={col.label}
                                key={key(col)}/>
                    )
                )
                }
            </DataTable>
        </div>
    }
};
