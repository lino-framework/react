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
        sr: PropTypes.array,
        rp: PropTypes.any,
        reload: PropTypes.func,
        srMap: PropTypes.func,
    };
    static defaultProps = {
        srMap: sr => sr,
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
            <Button icon={"pi pi-refresh"} onClick={this.props.reload}/>
            {actorData.toolbarActions.map((an) => {
                return <Button label={an} key={an}
                               disabled={actorData.ba[an].select_rows && this.props.sr.length === 0}
                               onClick={() => this.runAction(an)}/>

            })}
        </React.Fragment>
    }
};

export default LinoBbar