import React, {Component} from "react";
import PropTypes from "prop-types";

import queryString from 'query-string';

import key from "weak-key";
import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';

import LinoComponents from "./LinoComponents"

export class LinoDetail extends Component {

    static propTypes = {
        match: PropTypes.object,
        actorId: PropTypes.string,
        packId: PropTypes.string,
        actorData: PropTypes.object,
        pk: PropTypes.string
    };
    static defaultProps = {};

    constructor() {
        super();
        this.state = {
            data: null,
            rows: []
        };
        this.reload = this.reload.bind(this);

    }


    reload() {
        this.setState({
            data: null,
            rows: []
        });

        fetch(`/api/${this.props.packId}/${this.props.actorId}`+`/${this.props.pk}` + `?${queryString.stringify({fmt: "json"})}`).then(
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
        console.log(this.props.actorId, "LinoDetail ComponentMount", this.props);
    };

    render() {
        const layout = this.props.actorData.ba.detail.window_layout;
        // const Comp = "Table";
        // return loaded ? this.props.render(data, Comp) : <p>{placeholder}</p>;
        const MainComp = LinoComponents[layout.main.react_name]
        return <div>
                <MainComp elem={layout.main} />
               </div>
    }
};
