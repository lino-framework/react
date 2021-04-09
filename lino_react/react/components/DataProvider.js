import React, {Component} from "react";
import PropTypes from "prop-types";
import queryString from 'query-string';
import {ProgressSpinner} from 'primereact/progressspinner';
// import Table from "./Table";
import {fetch as fetchPolyfill} from 'whatwg-fetch';
import {LoadingMask} from "./LoadingMask";

// from https://www.npmjs.com/package/whatwg-fetch
import AbortController from 'abort-controller';

// use native browser implementation if it supports aborting
const abortableFetch = ('signal' in new Request('')) ? window.fetch : fetchPolyfill


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
        this.controller = new AbortController();
        this.reloadData = this.reloadData.bind(this);
        this.reload = this.reloadData;
    }

    componentDidMount() {
        this.reloadData();
    }

    componentWillUnmount() {
        this.controller.abort();
    }

    reloadData() {
        this.setState({loaded: false});
        let query = {fmt: "json"}
        window.App.add_su(query);
        abortableFetch(this.props.endpoint + `?${queryString.stringify(query)}`, {
            signal: this.controller.signal})
            .then(response => {
                if (response.status !== 200) {
                    this.setState({placeholder: "Something went wrong"});
                    // console.log("20210223 Something went wrong");
                    return {status:response.status$} //
                }
                return response.json();
            })
            .then(data => {
                this.props.post_data(data);
                this.setState({data: data, loaded: true, everloaded: true});
            }).catch(function(ex) {
              if (ex.name === 'AbortError') {
                console.log('request aborted', ex)
              }
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
