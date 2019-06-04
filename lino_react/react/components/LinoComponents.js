import React, {Component} from "react";
import key from "weak-key";

import {TabPanel, TabView} from 'primereact/tabview';
import {Panel} from 'primereact/panel';
import {InputText} from 'primereact/inputtext';
import {Checkbox} from 'primereact/checkbox';
import {Editor} from 'primereact/editor';
import {Button} from 'primereact/button';
import {Dropdown} from 'primereact/dropdown';
import {Password} from 'primereact/password';
import {Calendar} from 'primereact/calendar';

import {LinoGrid} from "./LinoGrid";
import {debounce} from "./LinoUtils";
import {SiteContext} from "./SiteContext"

import classNames from 'classnames';
import {ForeignKeyElement} from "./ForeignKeyElement";

export const Labeled = (props) => {
    return <React.Fragment>
        {!props.hide_label && props.elem.label && <React.Fragment>
            <label className={classNames(
                "l-label",
                {"l-label--unfilled": !props.isFilled},
            )}> {props.elem.label}:</label>
            <br/>
        </React.Fragment>}
        {props.children}
    </React.Fragment>
};

// Shortcut functions for getting the correct value from the props.
function getValue(props) {
    return props.in_grid ? props.data[props.elem.fields_index] : props.data[props.elem.name]
}
function getHiddenValue(props) {
    return props.in_grid ? props.data[props.elem.fields_index + 1] : props.data[props.elem.name + "Hidden"]
}
function getDataKey(props ) {
    return props.in_grid ? props.elem.fields_index : props.elem.name
}

function shouldComponentUpdate(nextProps, nextState)
{ // requred for grid editing, otherwise it's very slow to type
    let {props} = this,
        value = getValue(props),
        next_value = getValue(nextProps);
    if (!props.in_grid) return true;
    if (nextState.value !== this.state.value) return true;
    return value !== next_value || props.prop_bundle.editing_mode !== nextProps.prop_bundle.editing_mode
}

const LinoComponents = {

    TabPanel: (props) => (
        <TabView className={classNames("lino-panel", {"lino-main": props.main})}>
            {props.elem.items.filter((e) => !e.hidden).map((panel, i) => {
                    let Child = LinoComponents._GetComponent(panel.react_name);
                    return <TabPanel header={panel.label} key={key(panel)} contentClassName={"lino-panel"}>
                        <Child {...props.prop_bundle} elem={panel} header={false}/>
                    </TabPanel>
                }
            )
            }

        </TabView>
    ),
    DetailMainPanel: (props) => {
        return <LinoComponents.Panel {...props} />
    },

    Panel: (props) => {

        const children = props.elem.items.filter((e) => !e.hidden).map((child, i) => {
            let Child = LinoComponents._GetComponent(child.react_name);
            let style = {};
            if (child.value.flex) {
                // style.width = props.elem.width + "ch"
                style.flex = child.value.flex
            }

            return <div style={style} key={key(child)} className={classNames("l-component")}>
                <Child {...props.prop_bundle} elem={child}/>
            </div>


        });
        let style = {};
        // style["height"] = "100%";
        // style["flex"] = "auto";
        // if (props.elem.flex) {
        //     style["flex"] = props.elem.flex;
        // }
        let panel_classes = classNames(
            "l-panel",
            {
                "l-panel-vertical": props.elem.vertical,
                "l-panel-horizontal": !props.elem.vertical,
                "l-panel-fieldset": props.elem.isFieldSet,
            });
        return <div style={style} className={panel_classes}
            // "card-w-header": props.header,
            // "lino-main": props.main,
            // "lino-panel": props.elem.vertical || true,
            // "p-col-align-stretch": props.elem.vertical,
        >
            {props.header && props.elem.label && <h1>{props.elem.label}</h1>}
            {children}
        </div>


    },

    SlaveSummaryPanel: (props) => {
        let style = {
            height: "100%",
            display: "flex",
            flexDirection: "column"
        };

        // let status = {};
        //
        // if (props.actorData.slave) {
        //     props.props_bundle.mt && (status.mt = props.props_bundle.mt);
        //     props.props_bundle.mk && (status.mk = props.props_bundle.mk);
        // }

        // window.App.runAction({
        //     an: "grid",
        //     actorId: `${this.props.packId}.${this.props.actorId}`,
        //     rp: null,
        //     status: status
        // })


        let summary = <div
            dangerouslySetInnerHTML={{
                __html: (props.in_grid ? props.data[props.elem.fields_index]
                    :
                    props.data[props.elem.name]) || "\u00a0"
            }}/>;
        if (props.in_grid) {
            return summary
        } else {
            // Unsure if the classNames are even passed to any HTML elems...
            return <Panel className="l-slave-summary-panel"
                          header={props.elem.label} style={style}>
                <Button className="l-slave-summary-expand-button p-button-secondary" icon="pi pi-external-link"
                        onClick={() => {
                            let status = {
                                base_params: {
                                    mk: props.prop_bundle.mk, // No need to test for if-slave as it's a slave-summary
                                    mt: props.prop_bundle.mt // We always know we need mk/mt be
                                }
                            };
                            // console.log(props.elem, detail_action);
                            window.App.runAction({
                                an: "grid", // use default_action ??
                                actorId: props.elem.field_options.name.replace("_", "."), // See elems.py, hopfully safe
                                rp: null, status: status
                            });
                        }}/>
                {summary}
            </Panel>
        }


    },

    ChoiceListFieldElement: class ChoiceListFieldElement extends React.Component {
        constructor() {
            super();
            this.shouldComponentUpdate = shouldComponentUpdate.bind(this);
        }

        render() {
            console.log("choice render")
            let {props} = this
            let value = getValue(props);
            let hidden_value = getHiddenValue(props);
            return <SiteContext.Consumer>{(siteData) => {
                let options = siteData.choicelists[props.elem.field_options.store];
                // console.log(options, siteData.choicelists, props.elem, props.elem.field_options.store);
                return <Labeled {...props.prop_bundle} elem={props.elem} labeled={props.labeled} isFilled={value}>
                    {props.prop_bundle.editing_mode ?
                        <div className="l-ChoiceListFieldElement">
                            <Dropdown
                                // autoWidth={false}
                                style={{width: "100%"}}
                                optionLabel={"text"} value={{text: value, value: hidden_value}}
                                datakey={"value"}
                                //Todo clear tied to props.elem.field_options.blank
                                showClear={props.elem.field_options.blank} // no need to include a blank option, if we allow for a clear button.
                                options={options}
                                container={props.prop_bundle.container}
                                onChange={(e) => {
                                    // console.log(e);
                                    let v = e.target.value === null ? "" : e.target.value['text'],
                                        h = e.target.value === null ? "" : e.target.value['value'];
                                    props.prop_bundle.update_value({
                                            [getDataKey(props)]: v,
                                            [props.in_grid ? props.elem.fields_index + 1 : props.elem.name + "Hidden"]: h,
                                        },
                                        props.elem,
                                        props.column)
                                }}
                                autoFocus
                                // placeholder={""}
                            />
                        </div> :
                        <div dangerouslySetInnerHTML={{__html: (value) || "\u00a0"}}/>
                    }</Labeled>
            }}
            </SiteContext.Consumer>

        }
    },

    URLFieldElement: (props) => {
        let value = getValue(props);
        return <Labeled {...props.prop_bundle} elem={props.elem} labeled={props.labeled} isFilled={value}>
            {props.prop_bundle.editing_mode ?
                <InputText style={{width: "100%"}}
                           value={value || ""}
                           onChange={(e) => props.prop_bundle.update_value({[getDataKey(props)]: e.target.value},
                               props.elem,
                               props.column)
                           }/>
                :
                <div className={"l-ellipsis"} style={{
                    "display": "block",
                    "text-overflow": "ellipsis",
                    "overflow": "hidden",
                    "white-space": "nowrap",
                    "max-width": "290px"
                }}><a href={value} title={value}>{value || "\u00a0"}</a></div>

            }
        </Labeled>
    },

    DisplayElement: (props) => {
        let value = getValue(props);
        return <Labeled {...props.prop_bundle} elem={props.elem} labeled={props.labeled} isFilled={value}>
            <div
                dangerouslySetInnerHTML={{__html: (value) || "\u00a0"}}/>
        </Labeled>
    },

    ConstantElement: (props) => {
        const value = props.elem.value.html;
        return <div
            dangerouslySetInnerHTML={{__html: (value) || "\u00a0"}}/>
    },

    CharFieldElement: class CharFieldElement extends React.Component {
        constructor() {
            super();
            this.shouldComponentUpdate = shouldComponentUpdate.bind(this);
        }
        render(){
            let {props} = this
        let value = getValue(props);
        return <Labeled {...props.prop_bundle} elem={props.elem} labeled={props.labeled} isFilled={value}>

            {props.prop_bundle.editing_mode ?
                <InputText style={{width: "100%"}}
                           value={value || ""}
                           onChange={(e) => props.prop_bundle.update_value({[getDataKey(props)]: e.target.value},
                               props.elem,
                               props.column)}
                           autoFocus={props.in_grid ? 'true' : undefined}/>
                :
                <div>{value || "\u00a0"}</div>
            }
        </Labeled>
    }},

    PasswordFieldElement: (props) => {
        let value = getValue(props);
        return <Labeled {...props.prop_bundle} elem={props.elem} labeled={props.labeled} isFilled={value}>
            <Password value={value}
                      onChange={(e) => props.prop_bundle.update_value({[getDataKey(props)]: e.target.value},
                          props.elem,
                          props.column)}
                      feedback={false} promptLabel={""}/>
        </Labeled>
    },

    AutoFieldElement: (props) => {
        let value = getValue(props);
        return <React.Fragment>
            <Labeled {...props.prop_bundle} elem={props.elem} labeled={props.labeled} isFilled={value}>
                {props.prop_bundle.editing_mode ?
                    <InputText style={{width: "100%"}} type="text" keyfilter="pint"
                               value={value || ""}
                               onChange={(e) => props.prop_bundle.update_value({[getDataKey(props)]: e.target.value},
                                   props.elem,
                                   props.column)}/>
                    : <div
                        dangerouslySetInnerHTML={{__html: value || "\u00a0"}}/>
                }
            </Labeled>
        </React.Fragment>
    },

    BooleanFieldElement: (props) => {
        return <div>
            <Labeled {...props.prop_bundle} elem={props.elem} labeled={props.labeled}
                     isFilled={true} // either 1 or 0, can't be unfilled
            >
                <Checkbox readOnly={!props.prop_bundle.editing_mode}
                          onChange={(e) => props.prop_bundle.update_value({[getDataKey(props)]: e.checked},
                              props.elem,
                              props.column)}
                          checked={
                              (getValue(props))
                              || false}/>
            </Labeled>
        </div>
    },

    TextFieldElement: class TextFieldElement extends React.Component {
        constructor(props) {
            super();
            this.state = {
                value:(getValue(props))
            };
            this.shouldComponentUpdate = shouldComponentUpdate.bind(this);
            this.onTextChange = this.onTextChange.bind(this);
            this.props_update_value = debounce(props.prop_bundle.update_value, 150);
        }

        onTextChange(e) {
            let {props} = this,
                value = e.htmlValue || "";
            this.setState({value:value});
            this.props_update_value({[getDataKey(props)]: value},
                props.elem,
                props.column)

        }

        render() {
            let {props} = this,
                {value} = this.state,
                style = {
                    height: "100%",
                    display: "flex",
                    flexDirection: "column"
                };

            let elem = props.prop_bundle.editing_mode ?
                <div className={"l-editor-wrapper"}
                     style={{"padding-bottom": "42px", "display": "flex", "height": "100%"}}>
                    <Editor //style={ {{/!*height: '100%'*!/}} }
                        value={value}
                        onTextChange={this.onTextChange}/>
                </div>
                :
                <div dangerouslySetInnerHTML={{__html: value || "\u00a0"}}/>;

            if (props.in_grid) return elem; // No wrapping needed

            if (props.prop_bundle.editing_mode) {
                elem = <Labeled {...props.prop_bundle} elem={props.elem} labeled={props.labeled}
                                isFilled={true} // either 1 or 0, can't be unfilled
                > {elem} </Labeled>
            } else {
                elem = <Panel header={props.elem.label} style={style}>
                    {elem}
                </Panel>
            }

            return elem
        }
    },

    DateFieldElement: (props) => {
        let value = (getValue(props));
        // if (typeof( value) === "string") value = new Date(value.replace(/\./g, '/'));
        return <Labeled {...props.prop_bundle} elem={props.elem} labeled={props.labeled} isFilled={value}>
            {props.prop_bundle.editing_mode ?
                <Calendar style={{width: "100%"}}
                          value={value}
                          dateFormat="dd.mm.yy"
                          onChange={(e) => {
                              let formatedDate;
                              if (e.value instanceof Date) {
                                  formatedDate = ("0" + e.value.getDate()).slice(-2) + "." +
                                      ("0" + (e.value.getMonth() + 1)).slice(-2) + "." +
                                      e.value.getFullYear();
                              }
                              props.prop_bundle.update_value({[getDataKey(props)]: formatedDate || e.value || ""},
                                  props.elem,
                                  props.column);
                          }
                          }
                    // showIcon={true}
                          viewDate={new Date()}
                />
                :
                <div dangerouslySetInnerHTML={{__html: value || "\u00a0"}}/>}
        </Labeled>
    },

    // DateTimeFieldElement: (props) => {
    //
    // },
    //
    TimeFieldElement: (props) => {
        let value = (getValue(props));
        let viewDate = new Date();
        let regex = /(^\d?\d)[:.]?(\d?\d)$/g;
        if (value && value.match(regex)) {
            let m = regex.exec(value);
            viewDate.setHours(m[1]);
            viewDate.setMinutes(m[2]);
        }
        // if (typeof( value) === "string") value = new Date(value.replace(/\./g, '/'));
        return <Labeled {...props.prop_bundle} elem={props.elem} labeled={props.labeled} isFilled={value}>
            {props.prop_bundle.editing_mode ?
                <Calendar style={{width: "100%"}} timeOnly={true} showTime={true}
                          value={value}
                    // dateFormat="dd.mm.yy"
                          onChange={(e) => {
                              let time;
                              if (e.value instanceof Date) {
                                  time = ("0" + e.value.getHours()).slice(-2) + ":" +
                                      ("0" + e.value.getMinutes()).slice(-2);
                              }
                              props.prop_bundle.update_value({[getDataKey(props)]: time || e.value || ""},
                                  props.elem,
                                  props.column)
                          }}
                          // onBlur={(e) => {
                          //     props.prop_bundle.update_value({[getDataKey(props]: e.target.value.replace(/\./g, ':')},
                          //         props.elem,
                          //         props.column)
                          // }}
                    // showIcon={true}
                          onViewDateChange={(e) => {
                          }}
                          viewDate={viewDate}
                />
                :
                <div dangerouslySetInnerHTML={{__html: value || "\u00a0"}}/>}
        </Labeled>
    },

    ForeignKeyElement: ForeignKeyElement,

    GridElement: (props) => {
        // https://jane.saffre-rumma.net/api/contacts/RolesByPerson?_dc=1545239958036&limit=15&start=0&fmt=json&rp=ext-comp-1353&mt=8&mk=316

        let [packId, actorId] = props.elem.actor_id.split("."); // "contacts.RolesByPerson"

        return <SiteContext.Consumer>{(siteData) => (<LinoGrid
            reload_timestamp={props.prop_bundle.reload_timestamp}
            ref={window.App.setRpRef}
            inDetail={true}
            match={props.prop_bundle.match} // todo
            mk={props.prop_bundle.mk}
            mt={props.prop_bundle.mt} // Correct: Should be content_type of the detail object, not of the grid actor
            // mt={siteData.actors[props.elem.actor_id].content_type} // Wrong:
            actorId={actorId}
            packId={packId}
            actorData={siteData.actors[props.elem.actor_id]}
        />)}</SiteContext.Consumer>


    },

    ActionParamsPanel: (props) => {
        let Panel = LinoComponents.Panel,
            {prop_bundle, elem, onSubmit} = props,
            is_sign_in = prop_bundle.action.an === "sign_in";
        return (
            <form target={is_sign_in ? "temp" : undefined}
                  id={is_sign_in ? "sign_in_submit" : undefined}
                  action={is_sign_in ? "/null/" : undefined}
                  method={prop_bundle.action.http_method}>
                <Panel {...prop_bundle} elem={elem} main={true}/>
                <input type="submit"
                       style={{"position": "absolute", "left": "-9999px", "width": "1px", "height": "1px"}}
                       tabIndex="-1"
                       onClick={(e) => {
                           e.preventDefault();
                           onSubmit();
                       }}
                />
            </form>
        )

    },

    UnknownElement: (props) => {
        let value = (getValue(props));
        // console.log(props); // Not needed, can get props via react debug tools in browser
        return (
            <Labeled {...props.prop_bundle} elem={props.elem} labeled={props.labeled} isFilled={value}>
                <span>{value || "\u00a0"}</span>
            </Labeled>
        )
    },

    /**
     *
     * @param name
     * @returns Component or UnknoenElement if the element is unknown
     * @private
     */
    _GetComponent: (name) => {
        let Child = LinoComponents[name];
        if (Child === undefined) {
            Child = LinoComponents.UnknownElement;
            console.warn(`${name} does not exist`,);
        }
        return Child
    }

};

LinoComponents.Panel.defaultProps = {header: true};
LinoComponents.ParamsPanel = LinoComponents.Panel;

LinoComponents.ComplexRemoteComboFieldElement = LinoComponents.ForeignKeyElement;

LinoComponents.QuantityFieldElement = LinoComponents.CharFieldElement; //Auto doesn't work as you need . or :

LinoComponents.HtmlBoxElement = LinoComponents.DisplayElement;
LinoComponents.GenericForeignKeyElement = LinoComponents.DisplayElement;

export default LinoComponents;