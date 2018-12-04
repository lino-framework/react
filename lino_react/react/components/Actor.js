import React, {Component} from "react";
import PropTypes from "prop-types";
import {BrowserRouter as Router, HashRouter, Route, Link} from "react-router-dom";
import {LinoGrid} from "./LinoGrid";
import {LinoDetail} from "./LinoDetail";

export class Actor extends Component {

    static propTypes = {
        match: PropTypes.object,
        actorId: PropTypes.string,
        packId: PropTypes.string,
        actorData: PropTypes.object
    };
    static defaultProps = {};

    constructor() {
        super();
        this.state = {};
        // this.method = this.method.bind(this);

    }

    // method() {return this.props.}

    componentDidMount() {
        console.log("Actor mount");
    };

    render() {
        return <div>
                <Route exact path={this.props.match.match.path} render={(match) => (
                       <LinoGrid
                            match={match}
                            actorId={this.props.actorId}
                            packId={this.props.packId}
                            key={this.props.packId + "." + this.props.actorId } // makes react recreate the LinoGrid instance
                            actorData={this.props.actorData}/>)
                }
                />
                <Route path={`${this.props.match.match.path}/:pk`} render={(match) => (
                       <LinoDetail
                            match={match}
                            actorId={this.props.actorId}
                            packId={this.props.packId}
                            pk={match.match.params.pk}
                            key={this.props.packId + "." + this.props.actorId +"."+ match.match.params.pk} // makes react recreate the LinoGrid instance
                            actorData={this.props.actorData}
                            />)}
                />

                </div>


         }

        }
