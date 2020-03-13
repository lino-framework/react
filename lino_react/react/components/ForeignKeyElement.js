import React, {Component} from "react";
import PropTypes from "prop-types";

import {SiteContext} from "./SiteContext"
import {Labeled} from "./LinoComponents"

import {Button} from 'primereact/button';
import {AutoComplete} from 'primereact/autocomplete';
import queryString from "query-string";
import {fetch as fetchPolyfill} from "whatwg-fetch";

import {ActorData, ActorContext} from "./SiteContext"

import DomHandler from 'primereact/domhandler';

export class ForeignKeyElement extends Component {

    static propTypes = {
        simple: PropTypes.bool, // For simple remote combo field
        link: PropTypes.bool, // show link to FK object,
    };
    static defaultProps = {
        simple: false,
        link: true,

    };

    constructor(props) {
        super();
        this.state = {
            rows: [],
            loading: false
        };
        this.OnExternalLinkClick = this.OnExternalLinkClick.bind(this);
        this.getChoices = this.getChoices.bind(this);

        this.openExternalLink = this.openExternalLink.bind(this);
        this.focus = this.focus.bind(this);
        this.openExternalLink = this.openExternalLink.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);
        this.onChange = this.onChange.bind(this);
        this.clear = this.clear.bind(this);
    }

    // Causes errors with dropdown opening
    // shouldComponentUpdate(nextProps, nextState) {
    //     let {props} = this,
    //         value = props.in_grid ? props.data[props.elem.fields_index] : props.data[props.elem.name],
    //         next_value = nextProps.in_grid ? nextProps.data[props.elem.fields_index] : nextProps.data[props.elem.name];
    //     return value !== next_value || props.prop_bundle.editing_mode !== nextProps.prop_bundle.editing_mode
    // }

    componentDidMount() {

    };

    onKeyPress(event) {
        if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && this.autoComplete && !this.autoComplete.isPanelVisible()) {
            this.autoComplete.search(event, "", "dropdown"); // open suggestions with keyboard
        } else if (event.key === "Enter" && this.autoComplete && this.autoComplete.isPanelVisible()) {
            let highlight = DomHandler.findSingle(this.autoComplete.panel.element, 'li.p-highlight');
            if (!highlight) {
                this.autoComplete.selectItem(event, this.state.rows[0]); // sets value but doesn't close panel
                this.autoComplete.hidePanel();
            }
        }
    };


    getChoices(query, actor_data) {
        // if (query.length < 3) return;
        // let actor = siteData.actors[this.props.elem.field_options.related_actor_id];
        let {data, mk, mt} = this.props;
        let ajaxQuery = {
            query: query,
            start: 0,
            //todo have pageing / some sort of max amount
        };
        let chooser_data = {},
            context_fields = actor_data.chooser_dict ? actor_data.chooser_dict[this.props.elem.name] : [];
        context_fields && context_fields.forEach((cf) => {
            let col = actor_data.col.find(c => c.name === cf),
                col_index,
                cf_value;
            if (col) col_index = col.fields_index_hidden || col.fields_index;

            cf_value = data[cf + "Hidden"];
            if (cf_value === undefined) cf_value = data[cf];
            if (cf_value === undefined) cf_value = data[col_index];
            chooser_data[cf] = cf_value;
        });
        Object.assign(ajaxQuery, chooser_data);
        if (mk !== undefined) {
            ajaxQuery.mk = mk;
        }
        if (mt !== undefined) {
            ajaxQuery.mt = mt;
        }

        window.App.add_su(ajaxQuery);


        fetchPolyfill(`/${this.props.action_dialog ? "apchoices" : "choices"}/${this.props.actorId.replace(".", "/")}${this.props.action_dialog ? `/${this.props.action.an}` : ""}/${this.props.elem.name}?${queryString.stringify(ajaxQuery)}`).then(
            (res) => (res.json())
        ).then(
            (data => this.setState(() => {
                return {
                    rows: data.rows.slice(),
                }
            }))
        ).catch(error => window.App.handleAjaxException(error));
    }

    OnExternalLinkClick(related_actor_id) {

        return (e) => {
            e.stopPropagation();
            ActorData.prototype.getData(related_actor_id, (relatedActorData) => {
                this.openExternalLink(relatedActorData)
            })
        }
    };

    openExternalLink(relatedActorData) {

        let {props} = this,
            {match} = props,
            actor = relatedActorData, //siteData.actors[props.elem.field_options.related_actor_id],
            // detail_action = actor.ba[actor.detail_action],
            // insert_action = actor.ba[actor.insert_action],
            // [packId, actorId] = props.elem.field_options.related_actor_id.split("."),
            pk = props.in_grid ? props.data[props.elem.fields_index + 1]
                : props.data[props.elem.name + 'Hidden'],
            status = {record_id: pk};

        if (actor.slave) {
            status.mk = props.mk;
            status.mt = props.mt;
        }
        // console.log(props.elem, detail_action);
        window.App.runAction({
            an: actor.detail_action, actorId: props.elem.field_options.related_actor_id,
            rp: null, status: status
        });
        // match.history.push(`/api/${packId}/${actorId}/${pk}`)
    };

    focus() {
        this.autoComplete.inputEl.focus();
    }

    onChange(e) {
        let {in_grid, elem, update_value, column} = this.props;
        console.log(e);
        e.originalEvent.stopPropagation();
        let v = {};
        if (typeof(e.value) === "string") {
            v[in_grid ? elem.fields_index : elem.name] = e.value;
            let rows = this.state.rows.filter(r => r.text.toLowerCase().includes(e.value.toLowerCase()))
            if (rows.length === 1) {
                v[in_grid ? elem.fields_index + 1 : elem.name + "Hidden"] = rows[0].value;
            } else if (rows.length === 0 && e.value === "" && this.props.elem.field_options.allowBlank) {
                v[in_grid ? elem.fields_index + 1 : elem.name + "Hidden"] = null;
            }
        } else {
            v[in_grid ? elem.fields_index : elem.name] = e.value.text;
            v[in_grid ? elem.fields_index + 1 : elem.name + "Hidden"] = e.value.value;
        }
        update_value(v, elem, column)
    }

    clear() {
        let {in_grid, elem, update_value, column} = this.props;
        update_value({
            [in_grid ? elem.fields_index : elem.name]: "",
            [in_grid ? elem.fields_index + 1 : elem.name + "Hidden"]: null,
        }, elem, column)
    }


    render() {
        const props = this.props;

        let value = (props.in_grid ? props.data[props.elem.fields_index] : props.data[props.elem.name]);

        if (value && typeof value === "object") value = value['text'];
        let {editing_mode} = props;

        // props.update_value({[props.elem.name]: e.value})
        return <ActorContext.Consumer>{(this_actorData) => (
            <Labeled {...props} elem={props.elem} labeled={props.labeled} isFilled={value}>
                <div className="l-ForeignKeyElement">
                    {editing_mode ?
                        <React.Fragment> <AutoComplete value={value}
                                                       appendTo={window.App.topDiv} onChange={this.onChange}
                                                       suggestions={this.state.rows}
                                                       dropdown={true}
                            // onFocus={(e) => e.target.select()}
                                                       field={props.simple ? "value" : "text"}
                                                       completeMethod={(e) => this.getChoices(e.query, this_actorData)}
                                                       container={this.props.container}
                                                       ref={(el) => this.autoComplete = el}
                                                       onKeyDown={this.onKeyPress}
                                                       onShowLoader={() => {
                                                           if (this.clearButton) {
                                                               this.clearButton.style.visibility = 'hidden'
                                                           }
                                                       }}
                                                       onHideLoader={() => {
                                                           this.setState({touch: Date()})
                                                           /*if (this.clearButton) {this.clearButton.style.visibility = 'visible'}*/
                                                       }} // should rerender the clear button and get rid it spinner?
                        />
                            {this.props.elem.field_options.allowBlank && value &&
                            <i key={this.state.touch} ref={el => this.clearButton = el}
                               className={"pi pi-times l-fk-clear"}
                               onClick={this.clear} style={{visibility: 'visible'}}/>}
                        </React.Fragment>
                        : <React.Fragment>
                            <div
                                dangerouslySetInnerHTML={{__html: value || "\u00a0"}}/>
                            {value && props.link &&
                            <Button icon="pi pi-external-link" className="p-button-secondary l-button-fk"
                                    onClick={this.OnExternalLinkClick(props.elem.field_options.related_actor_id)}
                            />}
                        </React.Fragment>}
                </div>

            </Labeled>)}</ActorContext.Consumer>

    }
}
