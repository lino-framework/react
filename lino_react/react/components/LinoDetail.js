import React, {Component} from "react";
import PropTypes from "prop-types";

import queryString from 'query-string';

import key from "weak-key";

import {Toolbar} from 'primereact/toolbar';
import {Button} from 'primereact/button';
import {AutoComplete} from 'primereact/autocomplete';
import {ToggleButton} from 'primereact/togglebutton';

import LinoComponents from "./LinoComponents"
import {debounce} from "./LinoUtils";
import LinoBbar from "./LinoBbar";

import {fetch as fetchPolyfill} from 'whatwg-fetch' // fills fetch

export class LinoDetail extends Component {

    static propTypes = {
        match: PropTypes.object,
        actorId: PropTypes.string,
        packId: PropTypes.string,
        actorData: PropTypes.object,
        pk: PropTypes.string,

        mt: PropTypes.int,
        mk: PropTypes.string, // we want to allow str / slug pks

        noToolbar: PropTypes.bool
    };
    static defaultProps = {
        noToolbar: false,
    };

    constructor() {
        super();
        this.state = {
            data: {},
            original_data: {}, // Copy of data for diff test
            disabled_fields: [],
            editing_mode: false,
            id: null,
            title: "",
            navinfo: {},
            searchSuggestions: [],
            quickSearchQuery: ""
            // loading: true
        };
        this.reload = this.reload.bind(this);
        this.update_value = this.update_value.bind(this);
        this.quickSearch = debounce(this.quickSearch.bind(this))

    }

    /**
     * Method for updating data values.
     * Is passed down to each Elem, takes an object of keyboard:value pairs.
     * Only merges the data object of this.state which is a copy of the original values.
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
        if (this.props.pk !== prevProps.pk ||
            this.props.mk !== prevProps.mk ||
            this.props.mt !== prevProps.mt) {
            this.reload();
        }
    }

    reload() {
        // this.setState({
        // loading: true,
        // });
        let query = {
            fmt: "json",
            rp: key(this)
            // mt: this.props.actorData.content_type, // Should be the master actor's PK, so should be a prop / url param
        };
        if (this.props.actorData.slave) {
            this.props.mt && (query.mt = this.props.mt);
            this.props.mk && (query.mk = this.props.mk);
        }
        fetchPolyfill(`/api/${this.props.packId}/${this.props.actorId}` + `/${this.props.pk}` + `?${queryString.stringify(query)}`).then(
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

    onNavClick(pk) {
        window.App.runAction({
            an: "detail",
            actorId: `${this.props.packId}.${this.props.actorId}`,
            rp: this,
            status: {
                base_params: {mk: this.props.mk, mt: this.props.mt},
                record_id: pk
            }
        });
    };


    quickSearch(query) {
        // if (query.length < 3) return;
        let ajaxQuery = {
            query: query,
            start: 0,
            //todo have pageing / some sort of max amount
        };

        fetchPolyfill(`/choices/${this.props.packId}/${this.props.actorId}?${queryString.stringify(ajaxQuery)}`).then(
            (res) => (res.json())
        ).then(
            (data => this.setState({
                searchSuggestions: data.rows,
            }))
        );
    }

    render() {
        const layout = this.props.actorData.ba[this.props.actorData.detail_action].window_layout;
        // const Comp = "Table";
        // return loaded ? this.props.render(data, Comp) : <p>{placeholder}</p>;
        const MainComp = LinoComponents._GetComponent(layout.main.react_name);
        let prop_bundle = {
            data: this.state.data,
            actorId: `${this.props.packId}.${this.props.actorId}`,
            disabled_fields: this.state.disabled_fields,
            update_value: this.update_value,
            editing_mode: this.state.editing_mode, // keep detail as editing mode only for now, untill beautifying things/
            mk: this.props.pk,
            mt: this.props.actorData.content_type,
            match: this.props.match,
        };
        prop_bundle.prop_bundle = prop_bundle;


        return (
            <React.Fragment>
                <h1 className={"l-detail-header"}> {this.state.title || "\u00a0"} </h1>

                {!this.props.noToolbar && <Toolbar className={"l-detail-toolbar"}>
                    <AutoComplete placeholder={"Quick Search"}
                                  value={this.state.quickSearchQuery}
                                  onChange={(e) => this.setState({quickSearchQuery: e.value})}
                                  suggestions={this.state.searchSuggestions}
                                  field={"text"} dropdown={true}
                                  minLength={2}
                                  completeMethod={(e) => this.quickSearch(e.query)}
                                  className={"l-detail-quicksearch"}
                                  onSelect={(e) => {
                                      console.log("Search selection onSelect", e);
                                      this.setState({quickSearchQuery: ""});
                                      this.onNavClick(e.value.value)
                                  }
                                  }
                    />
                    < i className="pi pi-bars p-toolbar-separator" style={{marginRight: '.25em'}}/>
                    <Button disabled={!this.state.navinfo.first || this.props.pk == this.state.navinfo.first}
                            className="l-nav-first"
                            icon="pi pi-angle-double-left"
                            onClick={() => this.onNavClick(this.state.navinfo.first)}/>
                    <Button disabled={!this.state.navinfo.prev || this.props.pk == this.state.navinfo.prev}
                            className="l-nav-prev"
                            icon="pi pi-angle-left"
                            onClick={() => this.onNavClick(this.state.navinfo.prev)}/>
                    <Button disabled={!this.state.navinfo.next || this.props.pk == this.state.navinfo.next}
                            className="l-nav-next"
                            icon="pi pi-angle-right"
                            onClick={() => this.onNavClick(this.state.navinfo.next)}/>
                    <Button disabled={!this.state.navinfo.last || this.props.pk == this.state.navinfo.last}
                            className="l-nav-last"
                            icon="pi pi-angle-double-right"
                            onClick={() => this.onNavClick(this.state.navinfo.last)}/>
                    <ToggleButton style={{"float": "right"}}
                                  checked={this.state.editing_mode}
                                  onChange={(e) => this.setState({editing_mode: e.value})}
                                  onLabel="Save" offLabel="Edit" onIcon="pi pi-save" offIcon="pi pi-pencil"
                    />
                    <br/>
                    <LinoBbar sr={[this.props.pk]} reload={this.reload} actorData={this.props.actorData} rp={this}/>
                </Toolbar>}
                <MainComp {...prop_bundle} elem={layout.main} title={this.state.title} main={true}/>
            </React.Fragment>
        )
    }
};
