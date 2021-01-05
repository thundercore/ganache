import NodeLink from "../components/NodeLink";
import React, { Component } from "react";
import jsonTheme from "../../../../common/utils/jsonTheme";
import ReactJson from "@ganache/react-json-view";
import { Link } from "react-router-dom";
import DetailSection from "./DetailSection";
import TransactionData from "../transaction-data";
import TransactionLink from "./TransactionLink";

const IGNORE_FIELDS = new Set(["@class", "participants"]);

class TransactionStates extends Component {
  constructor(props){
    super(props);

    const nodes = this.props.nodes;
    const notaries = this.props.notaries;
    this.state = {
      selectedIndex: null,
      nodes,
      notaries,
      txs: new Map()
    };
  }

  getCleanState(state) {
    const data = state.state.data;
    const cleanState = {};
    for (const key in data) {
      if (IGNORE_FIELDS.has(key)) continue;
      cleanState[key] = data[key];
    }
    return cleanState;
  }

  renderStateHeader(state, type) {
    const index = state.ref.index;
    const txhash = state.ref.txhash;
    const txData = this.getCleanState(state);
    const meta = state.metaData;
    return (
      <div className="corda-details-section corda-transaction-details">
        <h3 className="Label">
          State {index} ({meta.status}) @ {meta.recordedTime}
          <div className="Label-rightAligned corda-transaction-classname">{state.state.contract}</div>
          {type === "Output" ? "" :
            <div className="corda-transaction-details-tx-link"><em>TX&nbsp;
              <Link style={{textTransform: "none"}} to={"/corda/transactions/" + txhash}>{txhash}</Link>
            </em></div>
          }
        </h3>
        
        <div className="Nodes DataRows corda-json-view">
          <ReactJson
            src={
              txData
            }
            name={false}
            theme={jsonTheme}
            iconStyle="triangle"
            edit={false}
            add={false}
            delete={false}
            enableClipboard={true}
            displayDataTypes={true}
            displayObjectSize={true}
            indentWidth={4}// indent by 4 because that's what Corda likes to do.
            collapsed={1}
            collapseStringsAfterLength={36}
          />
        </div>
      </div>
    );
  }

  getWorkspaceNodeByType(type, owningKey) {
    return this.state[type].find(node => owningKey === node.owningKey);
  }

  getWorkspaceNode(owningKey) {
    return this.getWorkspaceNodeByType("nodes", owningKey);
  }

  getWorkspaceNotary(owningKey) {
    return this.getWorkspaceNodeByType("notaries", owningKey);
  }

  componentWillReceiveProps = async(props) => {
    if (props !== this.props) {
      const nds = this.state.nodes.concat(this.state.notaries).slice();
      const transactions = await TransactionData.getAllTransactions(nds, nds, this.props.postgresPort);
      const linkedTransactions = new Map(this.state.txs);
      for (const tx of transactions) {
        for (const [, state] of tx.states) {
          const hash = state.ref.txhash;
          const key = hash;
          const linearId = state?.state?.data?.linearId?.id;
          if (linearId) {
            const txs = linkedTransactions.get(linearId);
            if (txs) {
              if (!txs.has(key)) {
                const link = (<TransactionLink key={key} tx={tx} />);
                txs.set(key, link);
              }
            } else {
              const link = (<TransactionLink key={key} tx={tx} />);
              linkedTransactions.set(linearId, new Map([[key, link]]));
            }
          }
        }
      }
      this.setState({
        txs: linkedTransactions
      });
    }
  }

  render() {
    const tabs = [];
    let selectedIndex = this.state.selectedIndex;
    let selectedState;
    const txStates = this.props.transaction.states;
    const states = [["Output", txStates], ["Input", this.props.inputs]];
    states.forEach(([type, states]) => {
      if (states === null) {
        tabs.push(<div key={"tab_button_" + type + "_loading"} style={{order: 9999999, cursor: "wait"}} ref={"tab_button_" + type + "_loading"} className="corda-tab Label">Loading {type} States...</div>);
        return;
      }
      for (let [index, state] of states) {
        const key = state.ref.txhash + state.ref.index;
        const linearId = state?.state?.data?.linearId?.id;
        if (selectedIndex === null) {
          selectedIndex = key;
        }
        const order = (type==="Input" ? 1000 : 0) + index;
        tabs.push(<div key={"tab_button_" + key} style={{order}} ref={"tab_button_" + key} onClick={this.setState.bind(this, {selectedIndex: key}, undefined)} className={(selectedIndex === key ? "corda-tab-selected" : "") + " corda-tab Label"}>{type} State {index}</div>);
        if (selectedIndex !== key) continue;
        if (!state.state) {
          selectedState = (<div className="Waiting Waiting-Padded">Loading State...</div>);
          continue;
        }

        const participants = state.state.data.participants || [];
        const workspaceNotary = this.getWorkspaceNotary(state.state.notary.owningKey);

        const linkedTxs = [...(this.state.txs?.get(linearId)?.values() || [])].filter(({key}) => {
            return key !== this.props.transaction.txhash
          });

        selectedState = (
          <div>
            {this.renderStateHeader(state, type)}

            <DetailSection label="Signers" hide={!state?.state?.data?.exitKeys?.length}>
              {state?.state?.data?.exitKeys?.map(nodeKey => {
                const workspaceNode = this.getWorkspaceNode(nodeKey);
                if (workspaceNode) {
                  return (<NodeLink key={"participant_" + workspaceNode.safeName} postgresPort={this.props.postgresPort} node={workspaceNode} />);
                }
              })}
            </DetailSection>

            <DetailSection label="Notary" hide={!workspaceNotary}>
              <NodeLink node={workspaceNotary} postgresPort={this.props.postgresPort} />
            </DetailSection>   

            <DetailSection label="Participants" hide={!participants.length}>
              {participants.map((node, i) => {
                const workspaceNode = this.getWorkspaceNode(node.owningKey);
                if (workspaceNode) {
                  return (<NodeLink key={"participant_" + workspaceNode.safeName} postgresPort={this.props.postgresPort} node={workspaceNode} />);
                } else {
                  return (<div className="DataRow" key={"participant_anon" + node.owningKey + i}><div className="Value"><em>Anonymized Participant</em></div></div>);
                }
              })}
            </DetailSection>

            <DetailSection label="In Vault Of" hide={!state.observers.size}>
              {[...state.observers].map(node => {
                return (<NodeLink key={"participant_" + node.safeName} postgresPort={this.props.postgresPort} node={node} />);
              })}
            </DetailSection>

            <DetailSection label="Linear State History" hide={linkedTxs.length < 1}>
              {linkedTxs}
            </DetailSection>
          </div>
        );
      }
    });

    return <>
      <div className="corda-tabs">
        {tabs}
      </div>
      {selectedState}
    </>;
  }
}

export default TransactionStates;
