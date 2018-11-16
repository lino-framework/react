import React from "react";
import ReactDOM from "react-dom";
import DataProvider from "./DataProvider";
import Table from "./Table";
import Menu from "./Menu";
import {Sidebar} from 'primereact/sidebar';
import {PanelMenu} from 'primereact/panelmenu';

import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

window.Table = Table;

class App extends React.Component {

    constructor() {
        super();
        this.state = {
            visible: true
        };
    }

    create_menu = (layout) => {

        const convert = (mi) => {
            let menu = {
                // label	    string	    null	Text of the item.
                label: mi.text,
                // icon	        string	    null	Icon of the item.
                // command	    function	null	Callback to execute when item is clicked.
                command: (event) => {
                    console.log(mi, event)
                }
                // url	        string	    null	External link to navigate when item is clicked.
                // items	    array	    null	An array of children menuitems.

                // disabled	    boolean	    false	When set as true, disables the menuitem.
                // target	    string	    null	Specifies where to open the linked document.
                // separator	boolean	    false	Defines the item as a separator.
                // style	    object	    null	Inline style of the menuitem.
                // className	string	    null	Style class of the menuitem.
            };
            if (mi.menu && mi.menu.items) {
                menu.items = mi.menu.items.map(mi => convert(mi))
            }
            return menu;
        };
        let result = layout.map(mi => convert(mi));
        console.log(result)
        return result
    };

    render() {
        return (
            <div>
                <Sidebar visible={this.state.visible} onHide={(e) => this.setState({visible: false})}>
                    <div className="layout-sidebar-scroll-content">
                        <DataProvider endpoint="ui/menu"
                                      render={(data) => <PanelMenu model={this.create_menu(data)}/>}
                        />
                    </div>
                </Sidebar>


                <DataProvider endpoint="api/tickets/AllTickets"
                              post_data={(data) => data.rows.map(row => {
                                  row.splice(-2)
                              })} // Remove Disabled rows & Is editable}
                    // render={(data, Comp) => {
                    //     const TagName = window[Comp];
                    //     return <TagName data={data}/>
                    // }}
                              render={(data) => <Table data={data.rows}/>}
                />
            </div>
        )
    }
}

const wrapper = document.getElementById("app");

wrapper ? ReactDOM.render(<App/>, wrapper) : null;
