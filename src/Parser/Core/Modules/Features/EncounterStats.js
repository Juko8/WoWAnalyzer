import React from 'react';
import PropTypes from 'prop-types';

import SPECS from 'common/SPECS';
import ROLES from 'common/ROLES';
import ITEMS from 'common/ITEMS';
import fetchWcl from 'common/fetchWcl';
import ActivityIndicator from 'Main/ActivityIndicator';

import ItemLink from 'common/ItemLink';
import ItemIcon from 'common/ItemIcon';
import SpellLink from 'common/SpellLink';
import SpellIcon from 'common/SpellIcon';
import { formatPercentage } from 'common/format';


/*
  Show statistics (talents, trinkets, legendaries) for the current boss, specID and difficulty
*/

class EncounterStats extends React.PureComponent {
  static propTypes = {
    currentBoss: PropTypes.number.isRequired,
    specID: PropTypes.number.isRequired,
    difficulty: PropTypes.number.isRequired,
  };

  LIMIT = 100;
  SHOW_TOP_ENTRYS = 8;
  metric = 'dps';

  constructor() {
    super();
    this.state = {
      mostUsedTrinkets: [],
      mostUsedLegendaries: [],
      mostUsedTalents: [],
      loaded: false,
      message: 'Loading statistics...',
    };
    this.load = this.load.bind(this);
  }

  addItem(array, item) {
    if (item.id === null || item.id === 0) {
      return array;
    }
    const index = array.findIndex(elem => elem.id === item.id);
    if (index === -1) {
      array.push({
        id: item.id,
        name: item.name.replace(/\\'/g, '\''),
        quality: item.quality,
        amount: 1,
      });
    } else {
      array[index].amount += 1;
    }

    return array;
  }

  load() {
    switch (SPECS[this.props.specID].role) {
      case ROLES.HEALER:
        this.metric = 'hps';
        break;
    
      default:
        this.metric = 'dps';
        break;
    }

    return fetchWcl(`rankings/encounter/${ this.props.currentBoss }`, {
      class: SPECS[this.props.specID].ranking.class,
      spec: SPECS[this.props.specID].ranking.spec,
      difficulty: this.props.difficulty,
      limit: this.LIMIT,
      metric: this.metric,
    }).then((stats) => {
      const talentCounter = [[], [], [], [], [], [], []];
      const talents = [];
      let trinkets = [];
      let legendaries = [];
      stats.rankings.forEach((rank, rankIndex) => {
        rank.talents.forEach((talent, index) => {
          if (talent.id !== null && talent.id !== 0) {
            talentCounter[index].push(talent.id);
          }
        });

        rank.gear.forEach((item, itemSlot) => {
          if (item.quality === 'legendary') {
            legendaries = this.addItem(legendaries, item);
          }

          if (itemSlot === 12 || itemSlot === 13) {
            trinkets = this.addItem(trinkets, item);
          }
        });
      });

      talentCounter.forEach(row => {
        const talentRow = row.reduce((prev, cur) => {
          prev[cur] = (prev[cur] || 0) + 1;
          return prev;
        }, {});
        talents.push(talentRow);
      });

      trinkets.sort((a,b) => {return (a.amount < b.amount) ? 1 : ((b.amount < a.amount) ? -1 : 0);} );
      legendaries.sort((a,b) => {return (a.amount < b.amount) ? 1 : ((b.amount < a.amount) ? -1 : 0);} );

      this.setState({
        mostUsedTrinkets: trinkets.slice(0, this.SHOW_TOP_ENTRYS),
        mostUsedLegendaries: legendaries.slice(0, this.SHOW_TOP_ENTRYS),
        mostUsedTalents: talents,
        loaded: true,
      });
    }).catch((err) => {
      this.setState({
        message: 'Something went wrong.',
      });
    });
  }

  componentWillUpdate(nextProps, nextState) {
    nextState.mostUsedTrinkets.forEach((trinket, index) => {
      if (ITEMS[trinket.id] === undefined) {
        console.error(`ITEM ${trinket.name} '${trinket.id}' UNKNOWN`);
      }
    });
  }

  render() {
    const rows = [15, 30, 45, 60, 75, 90, 100];

    if (this.state.loaded) {
      return (
        <div style={{ border: 0, marginTop: 40 }}>
          <div className="panel-heading results btn-link selected" style={{ padding: 20, marginTop: 60 }}>
            <h2>This shows statistics of the top { this.LIMIT } logs, ranked by { this.metric.toLocaleUpperCase() }</h2>
          </div>
          <div className="flex-main">
            <div className="row">
              <div className="col-md-6">
                <div className="flex-main">
                  <div className="panel-heading" style={{ boxShadow: 'none', borderBottom: 0 }}>
                    <h2>Most used Legendaries</h2>
                  </div>
                  <div className="row" style={{ paddingLeft: 20 }}>
                    {this.state.mostUsedLegendaries.map((legendary) =>
                      <div className="col-md-3" key={legendary.id} style={{ textAlign: 'center', margin: '10px auto' }}>
                        <ItemLink id={legendary.id} className={ legendary.quality }>
                          <ItemIcon 
                            id={ITEMS[legendary.id] !== undefined ? ITEMS[legendary.id].id : ITEMS[0].id} 
                            className={legendary.quality}
                            style={{ width: '4em', height: '4em', border: '3px solid' }}
                            noLink
                          />
                          <div>{formatPercentage(legendary.amount / this.LIMIT, 0)}%</div>
                        </ItemLink>
                    </div>
                    )}
                  </div>
                </div>
                <div className="flex-main">
                  <div className="panel-heading" style={{ boxShadow: 'none', borderBottom: 0, marginTop: 40 }}>
                    <h2>Most used Trinkets</h2>
                  </div>
                  <div className="row" style={{ paddingLeft: 20 }}>
                    {this.state.mostUsedTrinkets.map((trinket) =>
                      <div className="col-md-3" key={trinket.id} style={{ textAlign: 'center', margin: '10px auto' }}>
                        <ItemLink id={trinket.id} className={ trinket.quality }>
                          <ItemIcon 
                            id={ITEMS[trinket.id] !== undefined ? ITEMS[trinket.id].id : ITEMS[0].id} 
                            className={trinket.quality}
                            style={{ width: '4em', height: '4em', border: '3px solid' }}
                            noLink
                          />
                          <div>{formatPercentage(trinket.amount / this.LIMIT, 0)}%</div>
                        </ItemLink>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="panel-heading" style={{ boxShadow: 'none', borderBottom: 0 }}>
                  <h2>Most used Talents</h2>
                </div>
                {this.state.mostUsedTalents.map((row, index) => 
                  <div className="row" key={index} style={{ marginBottom: 15, paddingLeft: 20 }}>
                    <div className="col-md-1" style={{ lineHeight: '3em', textAlign: 'right'}}>{rows[index]}</div>
                    {Object.keys(row).sort((a,b) => {return row[b]-row[a];}).map((talent, talentIndex) => 
                      <div key={talentIndex} className="col-md-2" style={{ textAlign: 'center' }}>
                        <SpellLink id={parseInt(talent, 10)}>
                          <SpellIcon style={{ width: '3em', height: '3em' }} id={parseInt(talent, 10)} noLink />
                        </SpellLink>
                        <span style={{ textAlign: 'center', display: 'block' }}>{formatPercentage(row[talent] / this.LIMIT, 0)}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      this.load();
      return (
        <div className="panel-heading" style={{ marginTop: 40, padding: 20, boxShadow: 'none', borderBottom: 0 }}>
          <ActivityIndicator text={ this.state.message } />
        </div>
      );
    }
  }
}

export default EncounterStats;
