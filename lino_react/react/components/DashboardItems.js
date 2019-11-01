import React, {Component} from "react";
import PropTypes from "prop-types";
import DataProvider from "./DataProvider";
import {LoadingMask} from "./LoadingMask";

export class DashboardItems extends Component {
    static propTypes = {
        // dashboard_items: PropTypes.int.
        user: PropTypes.string
    };
    static defaultProps = {
        P: 0
    };

    constructor() {
        super();
        this.state = {
            stamp: Date(),
            unloaded: true,
        };
        // this.method = this.method.bind(this);
        this.reloadData = this.reload;
        this.onDataGet = this.onDataGet.bind(this)
    }
    // method() {return this.props.}

    reload() {
        // this.setState({ // Set new stamp forcing reloading of each DP
        //     stamp:Date()
        // });
        Object.keys(window.App.rps).filter(k => k.includes("dashboard")).forEach(d => {
           window.App.rps[d].reload();
        })
    }

    onDataGet(d){
        this.setState({
            unloaded: false
        })
    }

    componentDidMount() {

    };

    render() {
        const S = this.state;
        const P = this.props;
        let len = P.dashboard_items;
        if (len === undefined){
            len = 0
        }
        // const Comp = "Table";
        // return loaded ? this.props.render(data, Comp) : <p>{placeholder}</p>;
        return <LoadingMask mask={S.unloaded} fillHeight={true} backgroundColor={""}>
            <DataProvider
                ref={(el) => {
                    window.App.setRpRef(el, `dashboard-main`)
                }}
                key={`${P.user}-${S.stamp}`}
                endpoint={"/api/main_html"}
                useEverLoaded={true}
                hideLoading={true}
                post_data={this.onDataGet}
                render={(data) => <div dangerouslySetInnerHTML={{__html: data.html}}></div>}
            />
            {[...Array(len).keys()].map(i =>
                <DataProvider
                    key={`${P.user}-${i}-${S.stamp}`}
                    ref={(el) => {
                        window.App.setRpRef(el,`dashboard-${i}`)
                    }}
                    endpoint={`/dashboard/${i}`}
                    post_data={this.onDataGet}
                    hideLoading={true}
                    render={(data) => <div dangerouslySetInnerHTML={{__html: data.html}}></div>}
                />)
            }
            </LoadingMask>
    }
};
