import React, {Component} from "react";
import PropTypes from "prop-types";

// import {SiteContext} from "./SiteContext"
// import {Labeled} from "./LinoComponents"
//
// import {Button} from 'primereact/button';
// import {AutoComplete} from 'primereact/autocomplete';
// import queryString from "query-string";
// import {fetch as fetchPolyfill} from "whatwg-fetch";
import {Dialog} from 'primereact/dialog';
import {SiteContext} from "./SiteContext";
import LinoComponents from "./LinoComponents";


export class LinoDialog extends Component {

    static propTypes = {
        action: PropTypes.object, // action object from siteData
        onClose: PropTypes.func,   // Some sort of callback
        onOk: PropTypes.func,   // Some sort of callback
        baseData: PropTypes.object,
        actorId: PropTypes.string, // Full id, with . ie: tickets.Alltickets
        title: PropTypes.string,
        router: PropTypes.object, // router
    };
    static defaultProps = {
        baseData: {},
    };

    constructor(props) {
        super();
        this.state = {
            visible: true,
            data: Object.assign({}, props.data)
        }
    };


    componentDidMount() {

    };

    update_value(values) {
        // console.log(arguments);
        this.setState((prevState) => (
                {data: Object.assign(prevState.data, {...values})}
            )
        ) // copy and replace values
    }


    render() {

        return <SiteContext.Consumer>{(siteData) => {
            const layout = this.props.action.window_layout;
            const MainComp = LinoComponents._GetComponent(layout.main.react_name);
            let prop_bundle = {
                data: this.state.data,
                actorId: this.props.actorId,
                // disabled_fields: this.state.disabled_fields,
                update_value: this.update_value,
                editing_mode: true,
                match: this.props.router,
            };
            prop_bundle.prop_bundle = prop_bundle;


            return <Dialog onHide={() => {
                this.setState({visible: false});
                this.props.onClose(this);
            }} visible={this.state.visible}
                           title={this.props.title}>
                <MainComp {...prop_bundle} elem={layout.main} main={true}/>
            </Dialog>
        }}</SiteContext.Consumer>

    }
}
