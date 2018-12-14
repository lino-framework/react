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
            data: {},
            original_data: {}, // Copy of data for diff test
            disabled_fields: [],
            id: null,
            title: "",
            nav_info: {},
            // loading: true
        };
        this.reload = this.reload.bind(this);
        this.update_value = this.update_value.bind(this);
    }

    /**
     * Method for updating data values.
     * Is passed down to each Elem, takes a dict of keyboard:value pairs.
     * Only merges the data object of this.state
     **/
    update_value(values) {
        // console.log(arguments);
        this.setState((prevState) => (
                {data: Object.assign(prevState.data, {...values})}
            )
        ) // copy and replace values
    }

    reload() {
        // this.setState({
        // loading: true,
        // });

        fetch(`/api/${this.props.packId}/${this.props.actorId}` + `/${this.props.pk}` + `?${queryString.stringify({fmt: "json"})}`).then(
            (res) => (res.json())
        ).then(
            (data) => {
                console.log("table GET", data);
                let df = data.data.disabled_fields;
                delete data.data.disabled_fields;
                this.setState({
                    data: data.data,
                    original_data: JSON.parse(JSON.stringify(data.data)), // Copy of data for diff test
                    disabled_fields: df,
                    id: data.id,
                    title: data.title,
                    nav_info: data.nav_info,
                    // loading:false,
                });
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
        const MainComp = LinoComponents._GetComponent(layout.main.react_name);
        let prop_bundle = {
            data: this.state.data,
            disabled_fields: this.state.disabled_fields,
            update_value: this.update_value,
            // editing_mode: true
        };
        prop_bundle.prop_bundle = prop_bundle;
        return (
            <React.Fragment>
                <h1> {this.state.title} </h1>

                {/*{!this.state.loading &&*/}

                <MainComp {...prop_bundle} elem={layout.main} title={this.state.title} main={true}/>
                {/*}*/}
            </React.Fragment>
        )
    }
};
