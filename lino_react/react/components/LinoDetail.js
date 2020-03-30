import React, {Component} from "react";
import PropTypes from "prop-types";

import queryString from 'query-string';

import key from "weak-key";

import {Toolbar} from 'primereact/toolbar';
import {Button} from 'primereact/button';
import {AutoComplete} from 'primereact/autocomplete';
import {ToggleButton} from 'primereact/togglebutton';

import LinoLayout from "./LinoComponents"
import {debounce, deepCompare} from "./LinoUtils";
import LinoBbar from "./LinoBbar";
import {LoadingMask} from "./LoadingMask"
import {ProgressBar} from 'primereact/progressbar';

import {fetch as fetchPolyfill} from 'whatwg-fetch' // fills fetch

import {Prompt} from 'react-router'

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
            pv: {},
            quickSearchQuery: "",
            reload_timestamp: 0, //Date.now() // 0 used to prevent reload after mount // used to propgate down to cause reloading of slave-grids on realod.
            loading: true
        };
        this.reload = this.reload.bind(this);
        this.update_value = this.update_value.bind(this);
        this.quickSearch = debounce(this.quickSearch.bind(this));
        this.consume_server_responce = this.consume_server_responce.bind(this);
        this.isDirty = this.isDirty.bind(this);
        this.save = debounce(this.save.bind(this), 200);
        this.saveThenDo = this.saveThenDo.bind(this);
        this.onDirtyLeave = this.onDirtyLeave.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);

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
        if (this.isDirty()) {
            window.onbeforeunload = (e) => {
                e.preventDefault();
                // Chrome requires returnValue to be set
                e.returnValue = '';
                this.onDirtyLeave({}, "UNLOAD")
            }
        } else {
            window.onbeforeunload = undefined
        }
    }

    reload() {
        this.setState({
            loading: true,
        });
        let query = {
            fmt: "json",
            rp: key(this)
            // mt: this.props.actorData.content_type, // Should be the master actor's PK, so should be a prop / url param
        };

        window.App.add_su(query);

        if (this.props.actorData.slave) {
            this.props.mt && (query.mt = this.props.mt);
            this.props.mk && (query.mk = this.props.mk);
        }
        fetchPolyfill(`/api/${this.props.packId}/${this.props.actorId}` + `/${this.props.pk}` + `?${queryString.stringify(query)}`).then(
            window.App.handleAjaxResponse
        ).then(
            this.consume_server_responce
        ).catch(error => window.App.handleAjaxException(error));
    }

    isDirty() {
        if (this.state.forceClean) {
            return false
        }
        else {
            return !deepCompare(this.state.data, this.state.original_data);
        }
    }

    save(callback) {
        if (this.isDirty()) {
            this.setState({loading: true});
            window.App.runAction({
                rp: this,
                an: "submit_detail",
                actorId: `${this.props.packId}.${this.props.actorId}`,
                sr: this.props.pk,
                response_callback: (data) => {
                    this.setState({editing_mode: false});
                    // this.consume_server_responce(data.data_record);
                    this.reload();
                    if (callback) callback(data)
                }
            })
        }
        ;
    }

    onDirtyLeave(nextLocation, routerAction) {
        let leave = () => {
            if (routerAction !== "UNLOAD") { // user was closing page or relaoding, just close dialog,
                this.setState({forceClean: true}); // required otherwise the prompt is caught again
                setTimeout(() => this.props.match.history.push(nextLocation.pathname), 25);
            }
        };
        let diag_props = {
            onClose: () => {
                window.App.setState((old) => {
                    let diags = old.dialogs.filter((x) => x !== diag_props);
                    return {dialogs: diags};
                });
            },
            closable: false,
            footer: <div>
                <Button label={"Save"} onClick={() => {
                    this.save(() => {
                        diag_props.onClose();
                        leave()
                    });
                }}/>
                <Button label={"No"} onClick={() => {
                    diag_props.onClose();
                    leave()
                }}/>
                <Button className={"p-button-secondary"} label={"Cancel"} onClick={() => {
                    diag_props.onClose();
                }}/>
            </div>,
            title: "Save changes",
            content: <div>Do you wish to save the current changes?</div>
        };
        // push to dialog stack
        window.App.setState((old) => {
            return {dialogs: [diag_props].concat(old.dialogs)}
        });
        return false;
    }

    saveThenDo(fn) {
        if (this.isDirty()) {
            this.save(fn)
        } else {
            fn()
        }

    }

    consume_server_responce(data) {
        // console.log("detail GET", data);
        if (data.success === false /* either false or undefined*/) {
            return
        }
        let df = data.data.disabled_fields;
        // delete data.data.disabled_fields;
        let original_data = JSON.parse(JSON.stringify(data.data));
        this.setState({
            data: data.data,
            original_data: original_data, // Copy of data for diff test
            disabled_fields: original_data.disabled_fields || [],
            id: data.id,
            title: data.title,
            navinfo: data.navinfo,
            reload_timestamp: Date.now(),
            pv: data.param_values,
            loading: false
            // loading:false,
        });

    }

    componentDidMount() {
        document.addEventListener('keydown', this.onKeyDown);
        this.reload();
        // console.log(this.props.actorId, "LinoDetail ComponentMount", this.props);
    };

    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKeyDown);
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
        window.App.add_su(ajaxQuery);

        fetchPolyfill(`/choices/${this.props.packId}/${this.props.actorId}?${queryString.stringify(ajaxQuery)}`).then(
            window.App.handleAjaxResponse
        ).then(
            (data => {
                if (data.success === false) return;
                this.setState({
                    searchSuggestions: data.rows,
                })
            })
        ).catch(error => window.App.handleAjaxException(error));
    }

    onKeyDown(event) {
        // console.log("keydown", event);
        if ((event.ctrlKey || event.metaKey) && String.fromCharCode(event.which).toLowerCase() === "s") {
            event.preventDefault();
            if (this.state.editing_mode) {
                this.isDirty() ? this.save() : this.setState({editing_mode: false});
            } else {
                this.setState({editing_mode: true});
            }
        }
        if (! event.ctrlKey && !event.altKey && event.key === "Insert") {
            event.preventDefault();
            window.App.runAction({
                an: "insert",
                actorId: this.props.actorData.id,
                status:{},
                rp: this,
            });

        }
    }

    render() {
        return (
            <React.Fragment>

                <Prompt message={this.onDirtyLeave}
                        when={this.isDirty()}
                />

                <h1 className={"l-detail-header"}>
                    <div dangerouslySetInnerHTML={{__html: this.state.title || "\u00a0"}}></div>
                </h1>

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
                                      // console.log("Search selection onSelect", e);
                                      this.setState({quickSearchQuery: ""});
                                      this.onNavClick(e.value.value)
                                  }
                                  }
                    />
                    < i className="pi pi-bars p-toolbar-separator" style={{marginRight: '.25em'}}/>
                    <Button
                        disabled={!this.state.navinfo || this.state.navinfo.first === null || this.props.pk == this.state.navinfo.first}
                        className="l-nav-first"
                        icon="pi pi-angle-double-left"
                        onClick={() => this.onNavClick(this.state.navinfo.first)}/>
                    <Button
                        disabled={!this.state.navinfo || this.state.navinfo.prev === null || this.props.pk == this.state.navinfo.prev}
                        className="l-nav-prev"
                        icon="pi pi-angle-left"
                        onClick={() => this.onNavClick(this.state.navinfo.prev)}/>
                    <Button
                        disabled={!this.state.navinfo || this.state.navinfo.next === null || this.props.pk == this.state.navinfo.next}
                        className="l-nav-next"
                        icon="pi pi-angle-right"
                        onClick={() => this.onNavClick(this.state.navinfo.next)}/>
                    <Button
                        disabled={!this.state.navinfo || this.state.navinfo.last === null || this.props.pk == this.state.navinfo.last}
                        className="l-nav-last"
                        icon="pi pi-angle-double-right"
                        onClick={() => this.onNavClick(this.state.navinfo.last)}/>
                    {this.props.actorData.editable && !this.state.data.disable_editing && <React.Fragment>
                        <ToggleButton style={{"float": "right"}}
                                      checked={this.state.editing_mode}
                                      onChange={(e) => {
                                          if (this.state.editing_mode && this.isDirty()) {
                                              this.save();
                                          }
                                          else {
                                              this.setState({editing_mode: e.value})
                                          }
                                      }}
                                      onLabel="Save" offLabel="Edit" onIcon="pi pi-save"
                                      offIcon="pi pi-pencil"
                        />
                        {this.state.editing_mode && <Button style={{"float": "right"}} label={"Cancel"} onClick={() => {
                            this.setState({
                                data: Object.assign({}, this.state.original_data),
                                editing_mode: false
                            })
                        }}/>}
                    </React.Fragment>
                    }
                    <br/>
                    <LinoBbar sr={[this.props.pk]} reload={this.reload} actorData={this.props.actorData} rp={this}
                              an={'detail'} runWrapper={this.saveThenDo} disabledFields={this.state.disabled_fields}/>


                    <ProgressBar mode="indeterminate" className={this.state.loading ? "" : "lino-transparent"}
                                 style={{height: '5px'}}></ProgressBar>

                </Toolbar>
                }
                <LinoLayout
                    window_layout={this.props.actorData.ba[this.props.actorData.detail_action].window_layout}
                    data={this.state.data}
                    actorId={`${this.props.packId}.${this.props.actorId}`}
                    actorData={this.props.actorData}
                    disabled_fields={this.state.disabled_fields}
                    update_value={this.update_value}
                    editing_mode={this.state.data.disable_editing ? false : this.state.editing_mode} // keep detail as editing mode only for now, untill beautifying things/}
                    pk={this.props.pk}
                    mk={this.props.mk}
                    mt={this.props.actorData.content_type}
                    match={this.props.match}
                    reload_timestamp={this.state.reload_timestamp}
                    title={this.state.title}
                    parent_pv={this.state.pv}
                />
            </React.Fragment>
        )
    }
};
