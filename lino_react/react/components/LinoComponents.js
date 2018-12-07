import React, {Component} from "react";
import key from "weak-key";
import {TabView, TabPanel} from 'primereact/tabview';
import {Panel} from 'primereact/panel';
import {InputText} from 'primereact/inputtext';

import classNames from 'classnames';


const LinoComponents = {

    TabPanel: (props) => (
        <TabView>
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
            const Child = LinoComponents[child.react_name];
            let style = {};
            if (props.elem.width) {
                style.width = props.elem.width + "ch"
            }
            return <div className={classNames({
                "p-col-12": props.elem.vertical,
                "p-col": !props.elem.vertical /*&& !props.elem.width*/
            })}
                // style={style}
            >
                {Child === undefined ?
                    (<span> {child.name} </span>) :
                    (<Child {...props.prop_bundle} elem={child}/>)
                }
            </div>
        });

        return props.elem.is_fieldset ? (
                <div className={"p-grid"}>
                    {children}
                </div>
            )
            :
            (

                <div className={classNames("card", "p-grid", {"card-w-header": props.header})}>
                    {props.header && props.elem.label && <h1>{props.elem.label}</h1>}
                    {children}
                </div>
            )

    },

    SlaveSummaryPanel: (props) => {
        let style = {};
        if (props.elem.width) {
            style.width = props.elem.width + "ch"
        }
        return <Panel header={props.elem.label} style={style} >
            <div dangerouslySetInnerHTML={{__html: props.data[props.elem.name]}}/>
        </Panel>

    },

    CharFieldElement: (props) => {
        let style = {};
        if (props.elem.width) {
            style.width = props.elem.width + "ch"
        }
        const name = props.elem.name;
        return <InputText style={style} value={props.data[props.elem.name]}
                          onChange={(e) => props.prop_bundle.update_value({[name]: e.target.value})}/>
    },

    AutoFieldElement: (props) => {
        let style = {};
        if (props.elem.width) {
            style.width = props.elem.width + "ch"
        }
        return <InputText style={style} type="text" keyfilter="pint" value={props.data[props.elem.name]}
                          onChange={(e) => props.prop_bundle.update_value({[props.elem.name]: e.target.value})}/>

    }
};

LinoComponents.Panel.defaultProps = {header: true};

export default LinoComponents;