import React, {Component} from "react";
import PropTypes from "prop-types";
import {BrowserRouter as Router, HashRouter, Route, Link} from "react-router-dom";
import {LinoGrid} from "./LinoGrid";
import {LinoDetail} from "./LinoDetail";
import queryString from "query-string"

import {SiteContext, ActorData, ActorContext} from "./SiteContext"

import key from "weak-key";

// import _ from 'lodash';

export class Actor extends Component {

    static propTypes = {
        match: PropTypes.object,
        actorId: PropTypes.string,
        packId: PropTypes.string,
        su: PropTypes.string,
        // actorData: PropTypes.object,

        mt: PropTypes.int,
        mk: PropTypes.string // we want to allow str / slug pks
    };
    static defaultProps = {};

    constructor(props) {
        super();
        this.state = {};
        // this.method = this.method.bind(this);
        console.log(props.match.location.search)

    }

    // method() {return this.props.}

    componentDidMount() {
        // console.log("Actor mount");
    };

    componentWillReceiveProps(nextProps) {
        // const changedProps = _.reduce(this.props, function (result, value, key) {
        //     return _.isEqual(value, nextProps[key])
        //         ? result
        //         : result.concat(key)
        // }, []);
        // console.log('changedProps: ', changedProps)
    }

    render() {
        return <ActorData key={this.props.actorId+this.props.su} actorId={this.props.packId + "." + this.props.actorId}>
            <ActorContext.Consumer>{(actorData) => {  return <React.Fragment> {
                    actorData.default_action === "grid" &&
                    <Route exact path={this.props.match.match.path} render={(match) => (
                        <LinoGrid
                            ref={window.App.setRpRef}
                            match={match}
                            actorId={this.props.actorId}
                            packId={this.props.packId}
                            key={this.props.packId + "." + this.props.actorId} // makes react recreate the LinoGrid instance
                            actorData={actorData}
                            mk={this.props.mk}
                            mt={this.props.mt}
                        />)
                    }
                    />
                }
                    {
                        actorData.detail_action === "detail" &&
                        <Route path={`${this.props.match.match.path}/:pk`} render={(match) => (
                            <LinoDetail
                                ref={window.App.setRpRef}
                                match={match}
                                actorId={this.props.actorId}
                                packId={this.props.packId}
                                pk={match.match.params.pk}
                                key={this.props.packId + "." + this.props.actorId} // makes react recreate the LinoGrid instance
                                actorData={actorData}
                                mk={this.props.mk}
                                mt={this.props.mt}
                            />)}
                        />
                    }
                    {
                        actorData.detail_action === "show" &&
                        <Route path={`${this.props.match.match.path}`} render={(match) => (
                            <LinoDetail
                                ref={window.App.setRpRef}
                                match={match}
                                actorId={this.props.actorId}
                                packId={this.props.packId}
                                pk={"-99998"}
                                key={this.props.packId + "." + this.props.actorId} // makes react recreate the LinoGrid instance
                                actorData={actorData}
                                mk={this.props.mk}
                                mt={this.props.mt}
                                noToolbar={true}
                            />)}

                        />
                    }
                </React.Fragment>

            }}</ActorContext.Consumer>
        </ActorData>
    }

}
