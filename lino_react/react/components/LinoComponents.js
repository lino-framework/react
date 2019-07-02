import React, {Component} from "react";
import PropTypes from "prop-types";

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
import DomHandler from "primereact/domhandler";

import {LinoGrid} from "./LinoGrid";
import {debounce} from "./LinoUtils";
import {SiteContext} from "./SiteContext"

import classNames from 'classnames';
import {ForeignKeyElement} from "./ForeignKeyElement";

// import InputTrigger from 'react-input-trigger';
// import Suggester from "./Suggester";
import TextFieldElement from "./TextFieldElement"

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
// in_grid wants fields index,
export function getValue(props) {
    return props.in_grid ? props.data[props.elem.fields_index] : props.data[props.elem.name]
}

export function getHiddenValue(props) {
    return props.in_grid ? props.data[props.elem.fields_index + 1] : props.data[props.elem.name + "Hidden"]
}

export function getDataKey(props) {
    return props.in_grid ? props.elem.fields_index : props.elem.name
}

export function shouldComponentUpdate(nextProps, nextState) { // requred for grid editing, otherwise it's very slow to type
    let {props} = this,
        value = getValue(props),
        next_value = getValue(nextProps);
    if (!props.in_grid) return true;
    if (nextState && //  for func components nestState === null
        nextState.value !== this.state.value) return true;
    return value !== next_value || props.editing_mode !== nextProps.editing_mode
}

export function getID(props){
    return props.data[props.actorData.pk_index];
}

const LinoComponents = {
    TabPanel: (props) => (
        <TabView className={classNames("lino-panel")}>
            {React.Children.map(props.children, (panel, i) => {
                    return <TabPanel header={panel.props.elem.label} contentClassName={"lino-panel"}>
                        {panel}
                    </TabPanel>
                }
            )
            }

        </TabView>
    ),
    Panel: (props) => {
        // const children = React.Children.map.((child, i) => {

        const children = React.Children.map(props.children, (child, i) => {
            let style = {};
            if (child.props.elem.value.flex) {
                // style.width = props.elem.width + "ch"
                style.flex = `1 1 ${child.props.elem.value.flex}%`;
            }
            return <div style={style} className={classNames("l-component")}>
                {child}
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
            // "lino-panel": props.elem.vertical || true,
            // "p-col-align-stretch": props.elem.vertical,
        >
            {(!props.parent || props.parent.react_name !== "TabPanel")/*&& props.header */ && props.elem.label &&
            <h1>{props.elem.label}</h1>}
            {children}
        </div>


    },

    SlaveSummaryPanel: (props) => {
        let style = {
            height: "100%",
            display: "flex",
            flexDirection: "column"
        };

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
                                    mk: props.mk, // No need to test for if-slave as it's a slave-summary
                                    mt: props.mt // We always know we need mk/mt be
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

        focus() {
            this.dropDown && this.dropDown.focusInput.focus();
        }

        render() {
            // console.log("choice render")
            let {props} = this;
            let value = getValue(props);
            let hidden_value = getHiddenValue(props);
            return <SiteContext.Consumer>{(siteData) => {
                let options = siteData.choicelists[props.elem.field_options.store];
                // console.log(options, siteData.choicelists, props.elem, props.elem.field_options.store);
                return <Labeled {...props} elem={props.elem} labeled={props.labeled} isFilled={value}>
                    {props.editing_mode ?
                        <div className="l-ChoiceListFieldElement"
                             style={{margin_top: "1px"}}>
                            <Dropdown
                                // autoWidth={false}
                                style={{width: "100%"}}
                                optionLabel={"text"} value={{text: value, value: hidden_value}}
                                datakey={"value"}
                                //Todo clear tied to props.elem.field_options.blank
                                showClear={props.elem.field_options.blank} // no need to include a blank option, if we allow for a clear button.
                                options={options}
                                container={props.container}
                                onChange={(e) => {
                                    // console.log(e);
                                    let v = e.target.value === null ? "" : e.target.value['text'],
                                        h = e.target.value === null ? "" : e.target.value['value'];
                                    props.update_value({
                                            [getDataKey(props)]: v,
                                            [props.in_grid ? props.elem.fields_index + 1 : props.elem.name + "Hidden"]: h,
                                        },
                                        props.elem,
                                        props.column)
                                }}
                                ref={el => this.dropDown = el}
                                // placeholder={""}
                            />
                        </div> :
                        <div dangerouslySetInnerHTML={{__html: (value) || "\u00a0"}}/>
                    }</Labeled>
            }}
            </SiteContext.Consumer>

        }
    },

    URLFieldElement: class ChoiceListFieldElement extends React.Component {
        constructor() {
            super();
            this.shouldComponentUpdate = shouldComponentUpdate.bind(this);
            this.focus = this.focus.bind();
        }

        focus() {
            this.input.element.focus();
        }

        render() {
            let {props} = this;
            value = getValue(props);
            return <Labeled {...props} elem={props.elem} labeled={props.labeled} isFilled={value}>
                {props.editing_mode ?
                    <InputText style={{width: "100%"}}
                               value={value || ""}
                               onChange={(e) => props.update_value({[getDataKey(props)]: e.target.value},
                                   props.elem,
                                   props.column)
                               }
                               ref={(el) => this.input = el}
                    />
                    :
                    <div className={"l-ellipsis"} style={{
                        "display": "block",
                        "text-overflow": "ellipsis",
                        "overflow": "hidden",
                        "white-space": "nowrap",
                        "max-width": "290px"
                    }}><a href={value} title={value}>{value || "\u00a0"}</a></div>

                }}
            </Labeled>
        }
    }

    ,

    DisplayElement: (props) => {
        let value = getValue(props);
        return <Labeled {...props} elem={props.elem} labeled={props.labeled} isFilled={value}>
            <div
                dangerouslySetInnerHTML={{__html: (value) || "\u00a0"}}/>
        </Labeled>
    }
    ,

    ConstantElement: (props) => {
        const value = props.elem.value.html;
        return <div
            dangerouslySetInnerHTML={{__html: (value) || "\u00a0"}}/>
    }
    ,

    CharFieldElement: class CharFieldElement extends React.Component {
        constructor() {
            super();
            this.shouldComponentUpdate = shouldComponentUpdate.bind(this);
            this.focus = this.focus.bind(this);
        }

        focus() {
            this.input.element.focus();
        }

        render() {
            let {props} = this,
                value = getValue(props);
            return <Labeled {...props} elem={props.elem} labeled={props.labeled} isFilled={value}>

                {props.editing_mode ?
                    <InputText style={{width: "100%"}}
                               value={value || ""}
                               onChange={(e) => props.update_value({[getDataKey(props)]: e.target.value},
                                   props.elem,
                                   props.column)}
                               autoFocus={props.in_grid ? 'true' : undefined}
                               ref={(el) => this.input = el}
                    />
                    :
                    <div>{value || "\u00a0"}</div>
                }
            </Labeled>
        }
    },

    PasswordFieldElement: class PasswordFieldElement extends React.Component {
        constructor() {
            super();
            this.shouldComponentUpdate = shouldComponentUpdate.bind(this);
        }

        focus() {
            this.passwordEl.inputEl.focus();
        }

        render() {
            let {props} = this,
                value = getValue(props);
            return <Labeled {...props} elem={props.elem} labeled={props.labeled} isFilled={value}>
                <Password value={value}
                          onChange={(e) => props.update_value({[getDataKey(props)]: e.target.value},
                              props.elem,
                              props.column)}
                          feedback={false} promptLabel={""}
                          ref={(el) => this.passwordEl = el}
                />
            </Labeled>
        }
    },

    AutoFieldElement: class AutoFieldElement extends React.Component {
        constructor() {
            super();
            this.shouldComponentUpdate = shouldComponentUpdate.bind(this);
            this.focus = this.focus.bind(this);
        }

        focus() {
            this.input.element.focus();
        }

        render() {
            let {props} = this,
                value = getValue(props);
            return <React.Fragment>
                <Labeled {...props} elem={props.elem} labeled={props.labeled} isFilled={value}>
                    {props.editing_mode ?
                        <InputText style={{width: "100%"}} type="text" keyfilter="pint"
                                   value={value || ""}
                                   onChange={(e) => props.update_value({[getDataKey(props)]: e.target.value},
                                       props.elem,
                                       props.column)}
                                   ref={(el) => this.input = el}
                        />
                        : <div
                            dangerouslySetInnerHTML={{__html: value || "\u00a0"}}/>
                    }
                </Labeled>
            </React.Fragment>
        }
    },

    BooleanFieldElement: (props) => {
        return <div>
            <Labeled {...props} elem={props.elem} labeled={props.labeled}
                     isFilled={true} // either 1 or 0, can't be unfilled
            >
                <Checkbox readOnly={!props.editing_mode}
                          onChange={(e) => props.update_value({[getDataKey(props)]: e.checked},
                              props.elem,
                              props.column)}
                          checked={
                              (getValue(props))
                              || false}/>
            </Labeled>
        </div>
    },

    TextFieldElement: TextFieldElement ,

    DateFieldElement: class DateFieldElement extends React.Component {
        constructor() {
            super();
            this.shouldComponentUpdate = shouldComponentUpdate.bind(this);
        }

        focus() {
            this.cal.inputElement.focus()
        }

        render() {
            let {props} = this,
                value = (getValue(props));
            // if (typeof( value) === "string") value = new Date(value.replace(/\./g, '/'));
            return <Labeled {...props} elem={props.elem} labeled={props.labeled} isFilled={value}>
                {props.editing_mode ?
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
                                  props.update_value({[getDataKey(props)]: formatedDate || e.value || ""},
                                      props.elem,
                                      props.column);
                              }
                              }
                        // showIcon={true}
                              viewDate={new Date()}
                              ref={(el) => this.cal = el}
                    />
                    :
                    <div dangerouslySetInnerHTML={{__html: value || "\u00a0"}}/>}
            </Labeled>
        }
    },

    // DateTimeFieldElement: (props) => {
    //
    // },
    //
    TimeFieldElement: class TimeFieldElement extends React.Component {
        constructor() {
            super();
            this.shouldComponentUpdate = shouldComponentUpdate.bind(this);
        }

        focus() {
            this.cal.inputElement.focus()
        }

        render() {
            let {props} = this,
                value = (getValue(props));
            let viewDate = new Date();
            let regex = /(^\d?\d)[:.]?(\d?\d)$/g;
            if (value && value.match(regex)) {
                let m = regex.exec(value);
                viewDate.setHours(m[1]);
                viewDate.setMinutes(m[2]);
            }
            // if (typeof( value) === "string") value = new Date(value.replace(/\./g, '/'));
            return <Labeled {...props} elem={props.elem} labeled={props.labeled} isFilled={value}>
                {props.editing_mode ?
                    <Calendar style={{width: "100%"}} timeOnly={true} showTime={true}
                              value={value}
                        // dateFormat="dd.mm.yy"
                              onChange={(e) => {
                                  let time;
                                  if (e.value instanceof Date) {
                                      time = ("0" + e.value.getHours()).slice(-2) + ":" +
                                          ("0" + e.value.getMinutes()).slice(-2);
                                  }
                                  props.update_value({[getDataKey(props)]: time || e.value || ""},
                                      props.elem,
                                      props.column)
                              }}
                        // onBlur={(e) => {
                        //     props.update_value({[getDataKey(props]: e.target.value.replace(/\./g, ':')},
                        //         props.elem,
                        //         props.column)
                        // }}
                        // showIcon={true}
                              onViewDateChange={(e) => {
                              }}
                              viewDate={viewDate}
                              ref={(el) => this.cal = el}

                    />
                    :
                    <div dangerouslySetInnerHTML={{__html: value || "\u00a0"}}/>}
            </Labeled>
        }
    },

    ForeignKeyElement: ForeignKeyElement,

    GridElement: (props) => {
        // https://jane.saffre-rumma.net/api/contacts/RolesByPerson?_dc=1545239958036&limit=15&start=0&fmt=json&rp=ext-comp-1353&mt=8&mk=316

        let [packId, actorId] = props.elem.actor_id.split("."); // "contacts.RolesByPerson"

        return <SiteContext.Consumer>{(siteData) => (<LinoGrid
            reload_timestamp={props.reload_timestamp}
            ref={window.App.setRpRef}
            inDetail={true}
            match={props.match} // todo
            mk={props.mk}
            mt={props.mt} // Correct: Should be content_type of the detail object, not of the grid actor
            // mt={siteData.actors[props.elem.actor_id].content_type} // Wrong:
            actorId={actorId}
            packId={packId}
            actorData={siteData.actors[props.elem.actor_id]}
        />)}</SiteContext.Consumer>


    },

    ActionParamsPanel: (props) => {
        let {action, onSubmit} = props,
            is_sign_in = action.an === "sign_in",
            Panel=LinoComponents.Panel;
        return (
            <form target={is_sign_in ? "temp" : undefined}
                  id={is_sign_in ? "sign_in_submit" : undefined}
                  action={is_sign_in ? "/null/" : undefined}
                  method={action.http_method}>
                {<Panel {...props} action_dialog={true}>
                    {props.children}
                </Panel>}
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
            <Labeled {...props} elem={props.elem} labeled={props.labeled} isFilled={value}>
                <span>{value || "\u00a0"}</span>
            </Labeled>
        )
    },
};

LinoComponents.Panel.defaultProps = {header: true};
LinoComponents.ParamsPanel = LinoComponents.Panel;
LinoComponents.DetailMainPanel = LinoComponents.Panel;
LinoComponents.ComplexRemoteComboFieldElement = LinoComponents.ForeignKeyElement;
LinoComponents.QuantityFieldElement = LinoComponents.CharFieldElement; //Auto doesn't work as you need . or :
LinoComponents.HtmlBoxElement = LinoComponents.DisplayElement;
LinoComponents.GenericForeignKeyElement = LinoComponents.DisplayElement;

class LinoLayout extends React.Component {

    static propTypes = {
        window_layout: PropTypes.object,
    };

    constructor() {
        super();
        this.firstFocusable = false;
        [this.renderComponent, this.focusFirst].forEach((e) =>
            this[e.name] = e.bind(this));

    }

    render() {
        let {window_layout} = this.props;
        let elem = this.props.elem ? this.props.elem : window_layout.main;
        return this.renderComponent(elem.react_name, {...this.props, id:getID(this.props), elem: elem, linoLayout: this})

    }

    focusFirst() {
        setTimeout(() => {
            this.firstFocusable && this.firstFocusable.focus()
        }, 5);
    }

    /**
     *
     * Called whenever a layout object gets and renders a child, should be used to find this.firstFocusable()
     * @param name
     * @returns Component or UnknownElement if the element is unknown
     * @private
     */
    renderComponent(name, props) {
        let Child = LinoComponents[name],
            ref;
        if (Child === undefined) {
            Child = LinoComponents.UnknownElement;
            console.warn(`${name} does not exist`,);
        }
        // if (!this.firstFocusableFound && Child.focusable){
        //     this.firstFocusableFound = Child.focus;
        // }
        if (!this.firstFocusable && Child.prototype.focus || Child.focus) {
            this.firstFocusable = "found"; // Need to change from false as it will be set later buy ref, not now.
            ref = (el) => this.firstFocusable = el;
        }

        return <Child {...props} ref={ref}>
            {props.elem.items && props.elem.items.filter(e => !e.hidden).map(e => {

                return this.renderComponent(e.react_name, {...props, key: key(e), elem: e, parent: props.elem})
            })}
        </Child>
    }

};


export default LinoLayout;