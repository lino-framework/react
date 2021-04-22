import React from 'react';

import {Button} from 'primereact/button';
import {DataViewLayoutOptions} from 'primereact/dataview';
import {InputText} from 'primereact/inputtext';
import {MultiSelect} from 'primereact/multiselect';
import {ProgressBar} from 'primereact/progressbar';
import {SplitButton} from 'primereact/splitbutton';
import {ToggleButton} from 'primereact/togglebutton';

import LinoBbar from './LinoBbar';
import './LinoHeader.css';


export default class LinoHeader extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            query: props.parent.data.query || "",
        };
        this.parent = props.parent;

        this.renderActionBar = this.renderActionBar.bind(this);
        this.renderDataViewLayout = this.renderDataViewLayout.bind(this);
        this.renderDataViewSortButton = this.renderDataViewSortButton.bind(this);
        this.renderParamValueControls = this.renderParamValueControls.bind(this);
        this.renderProgressBar = this.renderProgressBar.bind(this);
        this.renderQuickFilter = this.renderQuickFilter.bind(this);
        this.renderToggle_colControls = this.renderToggle_colControls.bind(this);
    }

    renderActionBar() {
        return <div style={{"textAlign": "left"}}>
            <LinoBbar
                actorData={this.parent.props.actorData}
                sr={this.parent.state.selectedRows}
                reload={this.parent.reset}
                srMap={(row) => row[this.parent.props.actorData.pk_index]}
                rp={this.parent}
                an={'grid'}
                runAction={window.App.runAction}/>
        </div>
    }

    renderDataViewLayout() {
        return <DataViewLayoutOptions
            onChange={e => {
                this.parent.setState({layout: e.value});
                this.parent.refresh();
            }}
            layout={this.parent.state.layout}/>
    }

    renderDataViewSortButton() {
        const model = this.parent.props.actorData.col.map((col) => ({
            label: col.name,
            value: String(col.fields_index),
            command: ((e) => {
                this.parent.data.sortField = e.item.value;
                this.parent.data.sortFieldName = e.item.label;
                this.parent.refresh();
            }),
        }));
        return <SplitButton
            icon={
                this.parent.data.sortOrder === 0 ? "pi pi-sort-alt" :
                this.parent.data.sortOrder === 1 ? "pi pi-sort-amount-up" :
                "pi pi-sort-amount-down"
            }
            label={"Sort By: " + (this.parent.data.sortFieldName || "")}
            model={model}
            onClick={(e) => {
                let order = this.parent.data.sortOrder === 1 ? -1 : 1;
                this.parent.onSort({sortOrder: order, sortField: this.parent.data.sortField});
            }}
            style={{verticalAlign: "bottom"}}/>
    }

    renderLayoutButton() {
        return <span className="p-buttonset">
            {//this.parent.props.actorData.item_layout &&
            <ToggleButton
                checked={this.parent.state.layout === "list"}
                offIcon="pi pi-bars"
                offLabel=""
                onChange={(e) => {
                    this.parent.setState({layout: "list", data_view: true});
                    this.parent.reload({wt: "c"});
                }}
                onIcon="pi pi-bars"
                onLabel=""/>}
            {//this.parent.props.actorData.card_layout &&
            <ToggleButton
                checked={this.parent.state.layout === "grid"}
                offIcon="pi pi-th-large"
                offLabel=""
                onChange={(e) => {
                        this.parent.setState({layout: "grid", data_view: true});
                        this.parent.reload({wt: "c"});
                }}
                onIcon="pi pi-th-large"
                onLabel=""/>}
            <ToggleButton
                checked={this.parent.state.layout === "table"}
                offIcon="pi pi-table"
                offLabel=""
                onChange={(e) => {
                    this.parent.setState({layout: "table", data_view: false});
                    this.parent.reload({wt: "g"});
                }}
                onIcon="pi pi-table"
                onLabel=""/>
        </span>
    }

    renderParamValueControls() {
        return this.parent.props.actorData.pv_layout && <React.Fragment>
            <Button icon={"pi pi-filter"} onClick={this.parent.showParamValueDialog}/>
            {
                Object.keys(this.parent.state.pv || {}).length !== 0 &&
                <Button icon={"pi pi-times-circle"} onClick={() => this.parent.refresh({pv: {}})}/>
            }
        </React.Fragment>
    }

    renderProgressBar() {
        return <ProgressBar
            mode="indeterminate"
            className={this.parent.state.loading ? "" : "lino-transparent"}
            style={{height: '5px'}}/>
    }

    renderQuickFilter(wide) {
        return <InputText
            className="l-grid-quickfilter"
            style={{
                width: wide ? "100%" : undefined,
                marginRight: wide ? "1ch" : undefined,
                marginLeft: wide ? "1ch" : undefined,
            }}
            placeholder="QuickSearch"
            value={this.state.query}
            onChange={(e) => {
                this.parent.data.query = e.target.value;
                this.setState({query: e.target.value});
                if (e.target.value === "") {
                    this.parent.reload({query: e.target.value});
                } else {
                    this.parent.refresh({query: e.target.value});
                }
            }}/>
    }

    renderToggle_colControls() {
        return <React.Fragment>
            <span style={{position: "relative"}} ref={ref => this.toggleCol = ref}>
                <Button
                    icon={"pi pi-list"}
                    onClick={() => {
                        this.parent.setState({toggle_col: true});
                        this.show_col_selector.show();
                    }}/>
                <span hidden={true}>
                    <MultiSelect
                        appendTo={this.toggleCol}
                        panelStyle={{zIndex: "99999", height: "auto", width: "auto", position: "absolute"}}
                        value={this.parent.data.show_columns}
                        options={this.parent.props.actorData.col.map((col) => {return {label: col.label, value: col.fields_index}})}
                        ref={(el) => this.show_col_selector = el}
                        onChange={(e) => {
                            this.parent.data.show_columns = e.value;
                            this.parent.refresh();
                        }}
                        onBlur={e => this.parent.setState({toggle_col: false})}/>
                </span>
            </span>
        </React.Fragment>
    }

    render() {
        return <React.Fragment>
            {this.parent.state.show_top_toolbar && <React.Fragment>
                <div className={"table-header"}>
                    <div>
                        {this.renderQuickFilter()}
                        {this.renderParamValueControls()}
                        {this.parent.state.layout !== "table" ? this.renderDataViewSortButton()
                            : this.renderToggle_colControls()}
                    </div>
                    {(this.parent.props.actorData.card_layout || this.parent.props.actorData.item_layout)
                        && this.renderLayoutButton()}
                </div>
                <div className={"table-header"}>
                    {this.renderActionBar()}
                </div>
            </React.Fragment>}
            <div className={"table-header"}>
                {this.renderProgressBar()}
            </div>
        </React.Fragment>
    }
}
