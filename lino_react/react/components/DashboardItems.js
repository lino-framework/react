import React, {Component} from "react";
import PropTypes from "prop-types";
import DataProvider from "./DataProvider";

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
            stamp: Date()
        };
        // this.method = this.method.bind(this);
        this.reloadData = this.reload;

    }
    // method() {return this.props.}

    reload() {
        this.setState({ // Set new stamp forcing reloading of each DP
            stamp:Date()
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
        return <div>
            <DataProvider
                ref={(el) => {
                    window.App.setRpRef(el)
                }}
                key={`${P.user}-${S.stamp}`}
                endpoint={"/api/main_html"}
                render={(data) => <div dangerouslySetInnerHTML={{__html: data.html}}></div>}
            />
            {[...Array(len).keys()].map(i =>
                <DataProvider
                    key={`${P.user}-${i}-${S.stamp}`}
                    ref={(el) => {
                        window.App.setRpRef(el,`dashboard-${i}`)
                    }}
                    endpoint={`/dashboard/${i}`}
                    hideLoading={true}
                    useEverLoaded={true}
                    render={(data) => <div dangerouslySetInnerHTML={{__html: data.html}}></div>}
                />)
            }

        </div>
    }
};
