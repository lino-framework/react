import React, {Component} from "react";
import PropTypes from "prop-types";

import queryString from 'query-string';

import key from "weak-key";

import {Column} from 'primereact/column';
import {Toolbar} from 'primereact/toolbar';
import {Button} from 'primereact/button';

import LinoComponents from "./LinoComponents"
import {fetch as fetchPolyfill} from 'whatwg-fetch' // fills fetch

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
            navinfo: {},
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

    componentDidUpdate(prevProps) {
        // console.log("Detail compDidUpdate")
        if (this.props.pk !== prevProps.pk) {
            this.reload();
        }
    }

    reload() {
        // this.setState({
        // loading: true,
        // });

        fetchPolyfill(`/api/${this.props.packId}/${this.props.actorId}` + `/${this.props.pk}` + `?${queryString.stringify({fmt: "json"})}`).then(
            (res) => (res.json())
        ).then(
            (data) => {
                console.log("detail GET", data);
                let df = data.data.disabled_fields;
                delete data.data.disabled_fields;
                this.setState({
                    data: data.data,
                    original_data: JSON.parse(JSON.stringify(data.data)), // Copy of data for diff test
                    disabled_fields: df,
                    id: data.id,
                    title: data.title,
                    navinfo: data.navinfo,
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
        const layout = this.props.actorData.ba[this.props.actorData.detail_action].window_layout;
        // const Comp = "Table";
        // return loaded ? this.props.render(data, Comp) : <p>{placeholder}</p>;
        const MainComp = LinoComponents._GetComponent(layout.main.react_name);
        let prop_bundle = {
            data: this.state.data,
            disabled_fields: this.state.disabled_fields,
            update_value: this.update_value,
            editing_mode: true, // keep detail as editing mode only for now, untill beautifying things/
            mk: this.props.pk,
            match: this.props.match,
        };
        prop_bundle.prop_bundle = prop_bundle;
        return (
            <React.Fragment>
                <h1> {this.state.title || "\u00a0"} </h1>

                <Toolbar>
                    {this.state.navinfo && <React.Fragment>
                        <Button disabled={!this.state.navinfo.first || this.props.pk == this.state.navinfo.first}
                                className="l-nav-first"
                                icon="pi pi-angle-double-left"
                                onClick={() => (this.props.match.history.push(`/api/${this.props.packId}/${this.props.actorId}/${this.state.navinfo.first}`))}/>
                        <Button disabled={!this.state.navinfo.prev || this.props.pk == this.state.navinfo.prev}
                                className="l-nav-prev"
                                icon="pi pi-angle-left"
                                onClick={() => (this.props.match.history.push(`/api/${this.props.packId}/${this.props.actorId}/${this.state.navinfo.prev}`))}/>
                        <Button disabled={!this.state.navinfo.next || this.props.pk == this.state.navinfo.next}
                                className="l-nav-next"
                                icon="pi pi-angle-right"
                                onClick={() => (this.props.match.history.push(`/api/${this.props.packId}/${this.props.actorId}/${this.state.navinfo.next}`))}/>
                        <Button disabled={!this.state.navinfo.last || this.props.pk == this.state.navinfo.last}
                                className="l-nav-last"
                                icon="pi pi-angle-double-right"
                                onClick={() => (this.props.match.history.push(`/api/${this.props.packId}/${this.props.actorId}/${this.state.navinfo.last}`))}/>
                    </React.Fragment>}
                </Toolbar>
                <MainComp {...prop_bundle} elem={layout.main} title={this.state.title} main={true}/>
            </React.Fragment>
        )
    }
};
