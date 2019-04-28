import React from 'react';
import { Link } from 'react-router-dom';
import _ from 'underscore';
import { serializeObj } from 'UrlHelper.jsx';

class Paginator extends React.Component {

  item(key, text, page, active, disabled) {
    const queryString = serializeObj(Object.assign({}, this.props.query, {page: page}));
    return (
      <li key={'page-' + key} className={'page-item' + (active ? ' active' : '') + (disabled ? ' disabled' : '')}>
        <Link {...(disabled ? { onClick: (e) => (e.preventDefault()) } : {})} className="page-link" to={this.props.path + (disabled ? '#' : '?' + queryString)}>{text}</Link>
      </li>
    );
  }
  
  render() {
    const pages = this.props.pages;

    const prev = (this.props.page > 1) ? this.item('prev', '‹ Prev', this.props.page-1) : null;
    const next = (this.props.page < pages) ? this.item('next', 'Next ›', this.props.page+1) : null;
    const first = (pages > 1 && this.props.page > 1) ? this.item('first', '« First', 1) : null;
    const last = (pages > 1 && this.props.page < pages) ? this.item('last', 'Last »', pages) : null;

    // This could be improved to act more like Kaminari's pagination.
    // For example, Kariminar does not display more than four pages to the right
    // on page 1 even if there are more than five pages.
    const paddedLinks = Math.floor(9 / 2);
    const extraOnRight = Math.max(0, 1 - (this.props.page - paddedLinks));
    const extraOnLeft = Math.max(0, paddedLinks - (pages - this.props.page));
    const middleMin = Math.max(1, this.props.page - paddedLinks - extraOnLeft);
    const middleMax = Math.min(pages, this.props.page + paddedLinks + extraOnRight);
    
    const middle = _.times(pages, (i) => i+1).filter((page) => {
      return page >= middleMin && page <= middleMax;
    }).map((page) => {
      return this.item(page, page, page, page == this.props.page);
    });
    if(middleMin > 1) middle.unshift(this.item('min-padding', '…', 1, false, true));    
    if(middleMax < pages) middle.push(this.item('max-padding', '…', 1, false, true));
    
    return (
      <div className="container">
        <nav>
          <ul className="pagination">
            {[...[first, prev], ...middle, ...[next, last]]}
          </ul>
        </nav>
      </div>
    );
  }
}

Paginator.defaultProps = {
  total: 1,
  pages: 1,
  page: 1
};

export default Paginator;
