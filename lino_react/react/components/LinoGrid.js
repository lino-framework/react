import React, {Component} from "react";
import PropTypes from "prop-types";

import queryString from 'query-string';

import key from "weak-key";
import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';

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
            rows: []
        };
        this.reload = this.reload.bind(this);
        this.onRowSelect = this.onRowSelect.bind(this);


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
    };

    render() {
        const {rows} = this.state;
        // const Comp = "Table";
        // return loaded ? this.props.render(data, Comp) : <p>{placeholder}</p>;
        return <div>
            <DataTable value={rows} paginator={false} selectionMode="single"
                       onSelectionChange={e => this.setState({selectedRow: e.value})}
                       onRowSelect={this.onRowSelect}>
                {this.props.actorData.col.map((col, i) => (
                    <Column field={String(col.fields_index)} header={col.label} key={key(col)}/>))
                }
            </DataTable>
        </div>
    }
};
