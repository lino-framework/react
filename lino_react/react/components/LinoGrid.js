import React, {Component} from "react";
import PropTypes from "prop-types";

import queryString from 'query-string';

import key from "weak-key";
import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';

import LinoComponents from "./LinoComponents"

export class LinoGrid extends Component {

    static propTypes = {
        match: PropTypes.object,
        actorId: PropTypes.string,
        packId: PropTypes.string,
        actorData: PropTypes.object
    };
    static defaultProps = {};

    constructor() {
        super();
        this.state = {
            data: null,
            rows: [],
            show_columns: {} // Used to override hidden value for columns
        };
        this.reload = this.reload.bind(this);
        this.onRowSelect = this.onRowSelect.bind(this);


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
                editing_mode: false
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


    reload() {
        this.setState({
            data: null,
            rows: []
        });

        fetch(`/api/${this.props.packId}/${this.props.actorId}` + `?${queryString.stringify({fmt: "json"})}`).then(
            (res) => (res.json())
        ).then(
            (data) => {
                console.log("table GET", data);
                this.setState({data: data, rows: data.rows});
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
        return <div>
            <DataTable responsive={true}
                       resizableColumns={true}
                       value={rows} paginator={false} selectionMode="single"
                       onSelectionChange={e => this.setState({selectedRow: e.value})}
                       onRowSelect={this.onRowSelect}>
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
