import React, {Component} from "react";
import PropTypes from "prop-types";
import queryString from 'query-string';
import {PanelMenu} from 'primereact/panelmenu';

class Menu extends Component {
    static propTypes = {
        layout: PropTypes.array.isRequired
        // render: PropTypes.func.isRequired
    };

    // state = {
    // data: [],
    // loaded: false,
    // placeholder: "Loading..."
    // };

    /**
     * Static method, turns JSON layout data from Lino into a struct compatible with PrimeReact
     * [
     {
         "menu": {
             "items": [
                 {
                     "handler": {
                         "action": "grid.tickets.AllTickets",
                         "rp": null,
                         "status": {}
                     },
                     "text": "All tickets",
                     "toolTip": "Shows all tickets."
                 }
             ]
         },
         "text": "Tickets"
     }, {
        "menu": {
            "items": [
                {
                    "handler": {
                        "action": "show.about.About",
                        "rp": null,
                        "status": {
                            "record_id": -99998
                        }
                    },
                    "text": "About",
                    "toolTip": "Show information about this site."
                }
            ]
        },
        "text": "Site"
    }
     ]
     */

    render = () => (
        <PanelMenu model={this.create_menu(this.props.layout)} style={{width: '300px'}}/>
    )
}

export default Menu;
