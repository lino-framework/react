import React, {Component} from "react";
import key from "weak-key";
import {TabView, TabPanel} from 'primereact/tabview';
import {Panel} from 'primereact/panel';
import {InputText} from 'primereact/inputtext';
import {Checkbox} from 'primereact/checkbox';
import {Editor} from 'primereact/editor';

import classNames from 'classnames';


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

            return <div style={style} className={classNames("l-component")}>
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
        if (props.elem.width) {
            // style.width = props.elem.width + "ch"
        }
        return <Panel header={props.elem.label} style={style}>
            <div dangerouslySetInnerHTML={{__html: props.data[props.elem.name]}}/>
        </Panel>


    },

    CharFieldElement: (props) => {
        return <React.Fragment>
            {props.elem.label && <label>{props.elem.label}</label>}
            {props.elem.label && <br/>}
            <InputText style={{width: "100%"}} value={props.data[props.elem.name] || ""}
                       onChange={(e) => props.prop_bundle.update_value({[props.elem.name]: e.target.value})}/>
        </React.Fragment>
    },

    AutoFieldElement: (props) => {
        return <React.Fragment>
            {props.elem.label && <label>{props.elem.label}</label>}
            {props.elem.label && <br/>}
            <InputText style={{width: "100%"}} type="text" keyfilter="pint" value={props.data[props.elem.name] || ""}
                       onChange={(e) => props.prop_bundle.update_value({[props.elem.name]: e.target.value})}/>
        </React.Fragment>
    },

    BooleanFieldElement: (props) => {
        return <div>
            {props.elem.label && <label>{props.elem.label}</label>}
            {props.elem.label && <br/>}
            <Checkbox onChange={(e) => props.prop_bundle.update_value({[props.elem.name]: e.checked} || false)}
                      checked={props.data[props.elem.name]}/>
        </div>
    },

    TextFieldElement: (props) => {
        return <React.Fragment>
            <Editor style={{
                // width: "100%",
                // height: '100%'
            }}
                    value={props.data[props.elem.name] || ""}
                    onTextChange={(e) => props.prop_bundle.update_value({[props.elem.name]: e.htmlValue})}
            />
        </React.Fragment>

    },

    UnknownElement: (props) => {

        return <span>{props.elem.label}</span>

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
            console.warn(`${name} does not exist`);
        }
        return Child
    }

};

LinoComponents.Panel.defaultProps = {header: true};

LinoComponents.HtmlBoxElement = LinoComponents.SlaveSummaryPanel;


export default LinoComponents;