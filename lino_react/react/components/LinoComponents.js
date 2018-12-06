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
                        <Child elem={panel} header={false} data={props.data} disabled_fields={props.disabled_fields}/>
                    </TabPanel>
                }
            )
            }

        </TabView>
    ),

    Panel: (props) => {

        const children = props.elem.items.map((child, i) => {
            const Child = LinoComponents[child.react_name];
            return <div className={classNames({"p-col-12":props.elem.vertical, "p-col":!props.elem.vertical})}>
                {Child === undefined ?
                    (<span> {child.name} </span>) :
                    (<Child elem={child} data={props.data} disabled_fields={props.disabled_fields}/>)
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
        return <Panel header={props.elem.label}>
            <div dangerouslySetInnerHTML={{__html: props.data[props.elem.name]}}/>
        </Panel>

    },

   CharFieldElement: (props) => {
       return <InputText value={props.data[props.elem.name]} onChange={(e) => props.update_value({value: e.target.value})}/>
   }

};

LinoComponents.Panel.defaultProps = {header: true}

export default LinoComponents;