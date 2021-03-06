 /* eslint-disable */

import React from 'react';
import { StaticQuery, graphql, Link, navigate } from 'gatsby';
import { Index } from 'elasticlunr';
import queryString from 'query-string';
import kebabCase from 'lodash/kebabCase';

import Layout from '../components/Layout';
import CommonFirstScreenSection from '../components/CommonFirstScreenSection';

import PeriscopeImage from '../img/periscope-image.svg';

const SearchFormQuery = props => {
  return (
    <StaticQuery
      query={graphql`
        query SearchIndexQueryTest {
          siteSearchIndex {
            index
          }
        }
      `}
      render={data => <SearchPage searchIndex={data.siteSearchIndex.index} {...props} />}
    />
  );
};

const POSTS_PER_PAGE = 8;

class SearchPage extends React.Component {
  state = {
    query: '',
    results: [],
    limit: POSTS_PER_PAGE,
    offset: 0,
    activePage: 1
  };

  componentDidMount() {
    const { location } = this.props;
    const getQuery = location.search ? queryString.parse(location.search) : '';

    if (!getQuery) {
      navigate('/');
    }

    this.search(getQuery.query);
  }

  componentDidUpdate(prevProps) {
    if (
      (prevProps.location.state || this.props.location.state) &&
      (prevProps.location.state && prevProps.location.state.query) !==
        (this.props.location.state && this.props.location.state.query)
    ) {
      const getQuery = (this.props.location.state && this.props.location.state.query) || ``;

      this.search(getQuery);
    }
  }

  getOrCreateIndex = () =>
    this.index
      ? this.index
      : // Create an elastic lunr index and hydrate with graphql query results
        Index.load(this.props.searchIndex);

  search = evt => {
    const query = evt;
    this.index = this.getOrCreateIndex();
    this.setState({
      query,
      // Query the index with search string to get an [] of IDs
      results: this.index
        .search(query, { expand: true })
        // Map over each ID and return the full document
        .map(({ ref }) => this.index.documentStore.getDoc(ref))
    });
  };

  handlePagination = page => {
    this.setState({
      limit: page * POSTS_PER_PAGE,
      offset: (page - 1) * POSTS_PER_PAGE,
      activePage: page
    });
  };

  render() {
    const { results, query, limit, offset, activePage } = this.state;
    return (
      <Layout seoTitle="Search - Nomod Way">
        <CommonFirstScreenSection isSearchPage handleSearchForm={this.search} />
        <ContentSectionWrapper
          limit={limit}
          offset={offset}
          activePage={activePage}
          searchQuery={query}
          searchResults={results}
          handlePagination={this.handlePagination}
        />
      </Layout>
    );
  }
}

const ContentSectionWrapper = ({
  searchQuery,
  searchResults,
  limit,
  offset,
  activePage,
  handlePagination
}) => {
  const QTY_OF_PAGES = Math.ceil(searchResults.length / POSTS_PER_PAGE);
  let Pages = [];

  for (let index = 0; index < QTY_OF_PAGES; index++) {
    Pages[index] = {
      isActive: activePage - 1 === index,
      number: index + 1
    };
  }

  return (
    <section className="search-page">
      <div className="container">
        <div className="row">
          <div className="col-12">
            {searchResults.length ? (
              <div className="search-page__wrapper">
                <h2 className="search-page__title">
                  {searchResults.length} results for <strong>{searchQuery}</strong>
                </h2>

                <ul className="search-page__results">
                  {searchResults.slice(offset, limit).map(article => (
                    <li key={article.id}>
                      <Link
                        to={`/${kebabCase(article.articleCategory)}-${kebabCase(
                          article.articleSubCategory
                        )}/${article.slug}`}
                      >
                        <h3>{article.title}</h3>
                        <p>{article.html.slice(0, 245)}...</p>
                      </Link>
                    </li>
                  ))}
                </ul>

                {Pages.length > 1 && (
                  <div className="search-page__pagination">
                    <nav>
                      {Pages.map(page => (
                        <span
                          key={page.number}
                          className={page.isActive ? 'active' : ''}
                          onClick={() => handlePagination(page.number)}
                        >
                          {page.number}
                        </span>
                      ))}
                    </nav>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="search-page__wrapper">
                  <h2 className="search-page__title">
                    Apologies, we didn't couldn't find anything that matched <strong>{searchQuery}</strong>
                  </h2>

                  <Link to="/#categories">Dive into our categories instead</Link>
                </div>
                <div className="search-page__periscope">
                  <img
                    src={PeriscopeImage}
                    atl={`We were unable to find results for ${searchQuery}`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchFormQuery;
