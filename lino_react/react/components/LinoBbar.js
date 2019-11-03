import React, {Component} from "react";
import PropTypes from "prop-types";
import key from "weak-key";

import {Button} from 'primereact/button';


/**
 * Uses actor_data to render the toolbar action of a detail or grid, also checks
 */

class LinoBbar extends Component {

    static propTypes = {
        actorData: PropTypes.object,
        an: PropTypes.string,
        sr: PropTypes.array,
        rp: PropTypes.any,
        reload: PropTypes.func,
        srMap: PropTypes.func,
        runWrapper: PropTypes.func,
    };
    static defaultProps = {
        srMap: sr => sr,
        sr: [],
        runWrapper: (fn) => (fn())
    };

    constructor(props) {
        super();
        this.state = {};
        this.runAction = this.runAction.bind(this);

    }

    componentDidMount() {

    };

    /**
     * * @param an: string, action name of action to be run
     */

    runAction(an) {
        //https://jane.saffre-rumma.net/api/working/Sessions/11119?_dc=1546445609030&sr=11119&an=end_session

        let sr = this.props.sr.map(this.props.srMap);

        window.App.runAction({
            an: an,
            actorId: this.props.actorData.id,
            rp: this.props.rp,
            status: status,
            sr: sr
        });
    }

    render() {
        const {actorData} = this.props;
        // const Comp = "Table";
        // return loaded ? this.props.render(data, Comp) : <p>{placeholder}</p>;
        return <React.Fragment>
            {this.props.reload && <Button icon={"pi pi-refresh"} onClick={this.props.reload}/>}
            {actorData.ba[this.props.an].toolbarActions && actorData.ba[this.props.an].toolbarActions.map((an) => {
                let action = window.App.state.site_data.actions[an];
                let icon_and_label = {label:action.label};
                if (action.icon) {
                    icon_and_label = {label:undefined, icon:action.icon,
                        tooltip:action.label,
                        tooltipOptions:{position: 'bottom'}}
                }
                else if (action.button_text){
                    icon_and_label = {label:action.button_text,
                        tooltip:action.label,
                        tooltipOptions:{position: 'bottom'}}
                }
                return <Button {...icon_and_label} key={an}
                               disabled={action.select_rows && this.props.sr.length === 0}
                               onClick={() => this.props.runWrapper(() => this.runAction(an))}/>

            })}
        </React.Fragment>
    }
};

export default LinoBbar