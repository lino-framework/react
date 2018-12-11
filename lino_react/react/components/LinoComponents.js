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
        <TabView className={classNames("lino-panel",{"lino-main": props.main})}>
            {props.elem.items.map((panel, i) => {
                    const Child = LinoComponents[panel.react_name];
                    return <TabPanel header={panel.label} key={key(panel)}>
                        <Child {...props.prop_bundle} elem={panel} header={false}/>
                    </TabPanel>
                }
            )
            }

        </TabView>
    ),

    Panel: (props) => {

        const children = props.elem.items.map((child, i) => {
            let Child = LinoComponents[child.react_name];
            if (Child === undefined) {
                Child = LinoComponents.UnknownElement;
            }
            let style = {};
            if (child.value.flex) {
                // style.width = props.elem.width + "ch"
                style.flex = child.value.flex
            }
            return <div className={classNames({
                "p-col-12": props.elem.vertical,
                "p-col": !props.elem.vertical /*&& !props.elem.width*/
            })}
                        style={style}
            >
                <Child {...props.prop_bundle} elem={child}/>

            </div>
        });
        // Should also have a Main class / struct for panel,
        //
        return props.elem.is_fieldset ? (
                <div className={"p-grid"}>
                    {children}
                </div>
            )
            :
            (

                <div className={classNames("card", "p-grid", {"card-w-header": props.header, "lino-main": props.main})}
                >
                    {props.header && props.elem.label && <h1>{props.elem.label}</h1>}
                    {children}
                </div>
            )

    },

    SlaveSummaryPanel: (props) => {
        let style = {};
        if (props.elem.width) {
            // style.width = props.elem.width + "ch"
        }
        return <Panel header={props.elem.label} style={style}>
            <div dangerouslySetInnerHTML={{__html: props.data[props.elem.name]}}/>
        </Panel>

    },

    CharFieldElement: (props) => {
        const name = props.elem.name;
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
            S
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
        return <div>
            <Editor style={{
                width: "100%",
                height: '100%'
            }}
                    value={props.data[props.elem.name] || ""}
                    onTextChange={(e) => props.prop_bundle.update_value({[props.elem.name]: e.htmlValue})}
            />
        </div>

    },

    UnknownElement: (props) => {

        return <span>{props.elem.label}</span>

    }
};

LinoComponents.Panel.defaultProps = {header: true};

export default LinoComponents;