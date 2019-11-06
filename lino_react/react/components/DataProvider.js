import React, {Component} from "react";
import PropTypes from "prop-types";
import queryString from 'query-string';
import {ProgressSpinner} from 'primereact/progressspinner';
// import Table from "./Table";
import {fetch as fetchPolyfill} from 'whatwg-fetch';
import {LoadingMask} from "./LoadingMask";


class DataProvider extends Component {
    static propTypes = {
        endpoint: PropTypes.string.isRequired,
        render: PropTypes.func.isRequired,
        post_data: PropTypes.func,
        hideLoading: PropTypes.bool,
        useEverLoaded: PropTypes.bool,

    };
    static defaultProps = {
        post_data: (data) => (data),
        hideLoading: false,
        useEverLoaded: false,
    };

    constructor() {
        super();
        this.state = {
            data: [],
            loaded: false,
            placeholder: "Loading..."
        };
        this.reloadData = this.reloadData.bind(this);
        this.reload = this.reloadData;
    }

    componentDidMount() {
        this.reloadData();
    }

    reloadData() {
        this.setState({loaded: false});
        let query = {fmt: "json"}
        window.App.add_su(query);
        fetchPolyfill(this.props.endpoint + `?${queryString.stringify(query)}`)
            .then(response => {
                if (response.status !== 200) {
                    return this.setState({placeholder: "Something went wrong"});
                }
                return response.json();
            })
            .then(data => {
                this.props.post_data(data);
                this.setState({data: data, loaded: true, everloaded: true});
            })
    };

    render() {
        const {data, loaded, placeholder, everloaded} = this.state;
        const {render} = this.props;
        // const Comp = "Table";
        // return loaded ? this.props.render(data, Comp) : <p>{placeholder}</p>;
        if (everloaded && !loaded) {
            // is loading with data, use loading mask
            return <LoadingMask mask={true}>
                {render(data)}
            </LoadingMask>
        }
        else {
            return <LoadingMask mask={false}>
                {loaded || everloaded && this.props.useEverLoaded
                    ? render(data) : this.props.hideLoading ? <div/> : <ProgressSpinner/>}
            </LoadingMask>
        }
    }
}

export default DataProvider;

