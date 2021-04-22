import React from 'react';

import {Dropdown} from 'primereact/dropdown';
import {Paginator} from 'primereact/paginator';


export default class LinoPaginator extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.parent = props.parent;
    }

    render() {
        if (this.parent.props.actorData.preview_limit === 0 ||
            this.parent.data.rows.length === 0 ||
            this.parent.data.count < this.parent.data.rowsPerPage) {
            return null
        } else if (this.parent.props.actorData.simple_paginator) {
            return null
        }
        return <Paginator
            rows={this.parent.data.rowsPerPage}
            paginator={true}
            first={this.parent.data.topRow}
            totalRecords={this.parent.data.count}
            template={this.parent.props.actorData.paginator_template || undefined}
            onPageChange={(e) => {
                this.parent.refresh({page: e.page});
            }}
            rightContent={
                this.parent.data.count && <span
                    className={"l-grid-count"}>Showing <Dropdown
                        style={{width: "80px"}}
                        value={this.parent.data.rowsPerPage}
                        placeholder={this.parent.data.rowsPerPage.toString()}
                        options={[25, 50, 100, 200, 400, 800]}
                        onChange={(e) => {
                            let value = parseInt(e.value);
                            this.parent.data.page = 0;
                            this.parent.data.rowsPerPage = value <= this.parent.data.count ? value : this.parent.data.count;
                            this.parent.refresh();
                        }}/>
                    <span> of {this.parent.data.count}</span> rows
                </span>
            }
        />
    }
}
