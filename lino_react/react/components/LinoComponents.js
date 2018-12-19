import React, {Component} from "react";
import key from "weak-key";

import {TabView, TabPanel} from 'primereact/tabview';
import {Panel} from 'primereact/panel';
import {InputText} from 'primereact/inputtext';
import {Checkbox} from 'primereact/checkbox';
import {Editor} from 'primereact/editor';
import {Button} from 'primereact/button';

import {LinoGrid} from "./LinoGrid";
import {SiteContext} from "./SiteContext"

import classNames from 'classnames';

const Labeled = (props) => {
    return <React.Fragment>
        {!props.hide_label && props.elem.label && <React.Fragment>
            <label className={classNames(
                {"l-label--unfilled": !props.isFilled}
            )}> {props.elem.label}:</label>
            <br/>
        </React.Fragment>}
        {props.children}
    </React.Fragment>
};

const LinoComponents = {

    TabPanel: (props) => (
        <TabView className={classNames("lino-panel", {"lino-main": props.main})}>
            {props.elem.items.map((panel, i) => {
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

        const children = props.elem.items.map((child, i) => {
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
        let result = <div
            dangerouslySetInnerHTML={{
                __html: (props.in_grid ? props.data[props.elem.fields_index]
                    :
                    props.data[props.elem.name]) || "\u00a0"
            }}/>;
        if (props.in_grid) {
            return result
        } else {
            return <Panel header={props.elem.label} style={style}>
                {result}
            </Panel>
        }


    },

    DisplayElement: (props) => {
        let value = props.in_grid ? props.data[props.elem.fields_index] : props.data[props.elem.name];
        return <Labeled {...props.prop_bundle} elem={props.elem} labeled={props.labeled} isFilled={value}>
            <div
                dangerouslySetInnerHTML={{__html: (value) || "\u00a0"}}/>
        </Labeled>
    },

    CharFieldElement: (props) => {
        let value = props.in_grid ? props.data[props.elem.fields_index] : props.data[props.elem.name];
        return <Labeled {...props.prop_bundle} elem={props.elem} labeled={props.labeled} isFilled={value}>

            {props.prop_bundle.editing_mode ?
                <InputText style={{width: "100%"}}
                           value={value || "\u00a0"}
                           onChange={(e) => props.prop_bundle.update_value({[props.elem.name]: e.target.value})}/>
                :
                <div
                    dangerouslySetInnerHTML={{__html: (value) || "\u00a0"}}/>

            }
        </Labeled>
    },

    AutoFieldElement: (props) => {
        let value = props.in_grid ? props.data[props.elem.fields_index] : props.data[props.elem.name];
        return <React.Fragment>
            <Labeled {...props.prop_bundle} elem={props.elem} labeled={props.labeled} isFilled={value}>
                {props.prop_bundle.editing_mode ?
                    <InputText style={{width: "100%"}} type="text" keyfilter="pint"
                               value={value || "\u00a0"}
                               onChange={(e) => props.prop_bundle.update_value({[props.elem.name]: e.target.value})}/>
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
                <Checkbox onChange={(e) => props.prop_bundle.update_value({[props.elem.name]: e.checked})}
                          checked={
                              (props.in_grid ? props.data[props.elem.fields_index] : props.data[props.elem.name])
                              || false}/>
            </Labeled>
        </div>
    },

    TextFieldElement: (props) => {
        return <React.Fragment>
            <Editor style={{
                // width: "100%",
                // height: '100%'
            }}
                    value={(props.in_grid ? props.data[props.elem.fields_index] : props.data[props.elem.name]) || "\u00a0"}
                    onTextChange={(e) => props.prop_bundle.update_value({[props.elem.name]: e.htmlValue})}
            />
        </React.Fragment>

    },

    ForeignKeyElement: (props) => {
        let value = (props.in_grid ? props.data[props.elem.fields_index] : props.data[props.elem.name]);
        return <Labeled {...props.prop_bundle} elem={props.elem} labeled={props.labeled} isFilled={value}>
            <div
                dangerouslySetInnerHTML={{__html: value || "\u00a0"}}/>
            {value && <Button label="Secondary" className="p-button-secondary" onClick={(e) => console.log(props.elem)}/>}
        </Labeled>

    },

    GridElement: (props) => {
        // https://jane.saffre-rumma.net/api/contacts/RolesByPerson?_dc=1545239958036&limit=15&start=0&fmt=json&rp=ext-comp-1353&mt=8&mk=316

        let [packId, actorId] = props.elem.actor_id.split("."); // "contacts.RolesByPerson"

        return <SiteContext.Consumer>{(siteData) => (<LinoGrid
            match={props.prop_bundle.match} // todo
            mk={props.prop_bundle.mk}
            mt={siteData.actors[props.elem.actor_id].content_type} // Should this be a state rather than prop?
            actorId={actorId}
            packId={packId}
            actorData={siteData.actors[props.elem.actor_id]}
        />)}</SiteContext.Consumer>

    },


    UnknownElement: (props) => {
        let value = (props.in_grid ? props.data[props.elem.fields_index] : props.data[props.elem.name]);
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

LinoComponents.HtmlBoxElement = LinoComponents.SlaveSummaryPanel;

export default LinoComponents;