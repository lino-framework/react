import React, {Component} from "react";
import key from "weak-key";
import {TabView,TabPanel} from 'primereact/tabview';
import {Panel} from 'primereact/panel';

import classNames from 'classnames';


const LinoComponents = {

    TabPanel: (props) => (
        <TabView>
           {props.elem.items.map((panel, i) => {
                const Child = LinoComponents[panel.react_name]
                return <TabPanel header={panel.label} key={key(panel)}>
                    <Child elem={panel} header={false} />
                </TabPanel>
                }
              )
            }

        </TabView>
    ),

    Panel: (props) => {
        return <div className={classNames("card", {"card-w-header":props.header})}>
            {props.header && <h1>{props.elem.label}</h1>}
            <p>{props.elem.label} </p>
        </div>


    }

};

LinoComponents.Panel.defaultProps = {header:true}

export default LinoComponents;