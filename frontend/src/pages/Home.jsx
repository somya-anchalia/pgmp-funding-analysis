import React, { useEffect, useReducer, useState } from "react";
import ApiService from "../services/ApiService";
import GrantCard from "../components/GrantCard";
import SearchInput from "../components/SearchInput";
import { Modal } from "react-bootstrap";
import moment from "moment";
import InfiniteScroll from "react-infinite-scroll-component";
import Navbar from "../components/Navbar";

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState(null);
  const [modalData, setModalData] = useState({});
  const [show, setShow] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [dataToShow, setDataToShow] = useState(0);
  const [sourceDataToShow, setSourceDataToShow] = useState("ALL");
  const [sortDataToShow, setSortDataToShow] = useState("default");
  const [page, setPage] = useState(1);

  const INITIAL_STATE = {
    query: [],
    data: [],
    page: 1,
    total: 0,
  };

  const reducer = (state, action) => {
    switch (action.type) {
      case "SET_QUERY":
        return { ...state, query: action.payload };
      case "FETCH_DATA":
        return {
          ...state,
          data: [...state.data, ...action.payload.data],
          total: action.payload.total,
        };
      case "SET_DATA":
        return { ...state, data: action.payload };
      case "SET_PAGE":
        return { ...state, page: action.payload };
      case "RESET_DATA":
        return { ...state, data: [], page: 1, total: 0 };
      default:
        return state;
    }
  };

  const [state, dispatchReducer] = useReducer(reducer, INITIAL_STATE);

  const fetchAllKeywords = async () => {
    try {
      let res = await ApiService.fetchAllKeywords();
      setKeywords(res);
    } catch (error) {
      console.log(error);
    }
  };

  const requestKeywordData = async () => {
    try {
      setLoading(true);
      if (state.query.length) {
        dispatchReducer({
          type: "RESET_DATA",
        });
        setPage(1);
        await ApiService.requestKeywordData(state.query);
        setErrors(null);
        setTimeout(async () => {
          await fetchKeywordData();
          await fetchAllKeywords();
          setLoading(false);
        }, 3000);
      } else {
        setErrors({
          message: "Please enter a keyword to continue",
        });
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const requestFreshKeywordData = async () => {
    try {
      setLoading(true);
      if (state.query.length) {
        await ApiService.requestFreshKeywordData(state.query);
        setTimeout(async () => {
          await fetchKeywordData();
          await fetchAllKeywords();
          setLoading(false);
        }, 3000);
      } else {
        setErrors({
          message: "Please enter a keyword to continue",
        });
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const fetchKeywordData = async (status = 0, source = "ALL") => {
    try {
      setLoading(true);
      let res = await ApiService.fetchKeywordData(
        state.query,
        dataToShow,
        sourceDataToShow,
        sortDataToShow,
        page
      );
      dispatchReducer({ type: "FETCH_DATA", payload: res });
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const actionButton = async (status, id) => {
    try {
      setLoading(true);
      await ApiService.setGrantStatus(status, id);
      // setData(data => data.filter(d => d.id !== id))
      dispatchReducer({
        type: "SET_DATA",
        payload: state.data.filter((d) => d.id !== id),
      });
      setShow(false);
    } catch (error) {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const setQuery = async (query) => {
    dispatchReducer({ type: "SET_QUERY", payload: query });
  };

  const setExistingKeyword = (e) => {
    dispatchReducer({
      type: "SET_QUERY",
      payload: [
        ...state.query,
        { label: e.target.value, value: e.target.value },
      ],
    });
    // fetchKeywordData(e.target.value);
  };

  const changeOtherData = async (status) => {
    dispatchReducer({
      type: "RESET_DATA",
    });
    setPage(1);
    setDataToShow(parseInt(status));
    // await fetchKeywordData(status);
  };

  const changeSourceData = async (source) => {
    dispatchReducer({
      type: "RESET_DATA",
    });
    setPage(1);
    setSourceDataToShow(source);
    // await fetchKeywordData(source);
  };

  const changeSortData = async (source) => {
    dispatchReducer({
      type: "RESET_DATA",
    });
    setPage(1);
    setSortDataToShow(source);
    // await fetchKeywordData(source);
  };

  const exportData = async () => {
    try {
      setLoading(true);
      let res = await ApiService.exportKeywordData(
        state.query,
        dataToShow,
        sourceDataToShow,
        sortDataToShow
      );

      // Create a URL for the blob
      const url = window.URL.createObjectURL(res);

      // Create a link element and click it to trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.download = `export-${moment().format("YYYY-MM-DD")}.xlsx`;
      document.body.appendChild(link);
      link.click();

      // Clean up by revoking the URL
      window.URL.revokeObjectURL(url);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   function handleScroll() {

  //     if (window.innerHeight + document.documentElement.scrollTop ===
  //       document.documentElement.offsetHeight) {
  //       console.log('Running')
  //       setPage(page => page + 1)
  //     }
  //   }

  //   window.addEventListener('scroll', handleScroll);
  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, [loading]);

  // useEffect(() => {
  //   console.log("Running data useEffect");
  //   console.log(state.data.map((d) => d.id));
  //   if (state.total > state.page * 12 && state.data.length < 5) {
  //     fetchKeywordData();
  //   }
  // }, [state.data]);

  useEffect(() => {
    fetchAllKeywords();
  }, []);

  useEffect(() => {
    fetchKeywordData();
    console.log(page);
  }, [dataToShow, sourceDataToShow, sortDataToShow, page]);

  return (
    <main>
      <Navbar />
      {errors ? (
        <section className="">
          <div className="container">
            <div className="alert alert-danger mb-0" role="alert">
              {errors?.message}
            </div>
          </div>
        </section>
      ) : null}
      <SearchInput
        query={state.query}
        setQuery={setQuery}
        loading={loading}
        requestKeywordData={requestKeywordData}
        requestFreshKeywordData={requestFreshKeywordData}
        keywords={keywords}
        setExistingKeyword={setExistingKeyword}
      />
      <section className="response py-3">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="h4 mb-0">Grant Data</div>
            <div className="d-flex align-items-center gap-2">
              <div className="form-group">
                <select
                  className="form-select"
                  value={sourceDataToShow}
                  onChange={(e) => changeSourceData(e.target.value)}
                  disabled={!state.data.length}
                >
                  <option value={"ALL"}>All Sources</option>
                  <option value={"EU"}>EU</option>
                  <option value={"NSF"}>NSF</option>
                  <option value={"GTR"}>GTR</option>
                </select>
              </div>

              <div className="form-group">
                <select
                  className="form-select"
                  value={dataToShow}
                  onChange={(e) => changeOtherData(e.target.value)}
                  disabled={!state.data.length}
                >
                  <option value={0}>New Data</option>
                  <option value={1}>Accepted Data</option>
                  <option value={2}>Rejected False Positives</option>
                </select>
              </div>
              <div className="form-group">
                <select
                  className="form-select"
                  value={sortDataToShow}
                  onChange={(e) => changeSortData(e.target.value)}
                  disabled={!state.data.length}
                >
                  <option value={"default"}>Default</option>
                  <option value={"relevance_desc"}>
                    Relevance: High to Low
                  </option>
                  <option value={"relevance_asc"}>
                    Relevance: Low to High
                  </option>
                  <option value={"funding_amount_desc"}>
                    Amount: High to Low
                  </option>
                  <option value={"funding_amount_asc"}>
                    Amount: Low to High
                  </option>
                  <option value={"date_started_desc"}>
                    Start Date: Newest to Oldest
                  </option>
                  <option value={"date_started_asc"}>
                    Start Date: Oldest to Newest
                  </option>
                </select>
              </div>
              <button
                disabled={!state.data.length}
                onClick={exportData}
                className="btn btn-success"
              >
                Export Data
              </button>
            </div>
          </div>
          <InfiniteScroll
            dataLength={state.data.length}
            next={() => setPage((page) => parseInt(page) + 1)}
            hasMore={state.data.length && state.total > page ? true : false}
            scrollThreshold={"1px"}
          >
            <div className="row">
              {state.data.map((d, index) => (
                <GrantCard
                  d={d}
                  actionButton={actionButton}
                  key={d.id + "-" + index}
                  setModalData={setModalData}
                  setShow={setShow}
                  dataToShow={dataToShow}
                />
              ))}
            </div>
          </InfiniteScroll>
        </div>
      </section>
      {loading ? (
        <div className="d-flex align-items-center justify-content-center">
          <div className="spinner-border" role="status"></div>
        </div>
      ) : null}
      <Modal show={show} onHide={() => setShow(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title className="text-uppercase h6">
            {modalData.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="">
          <div className="card h-100">
            <div className="card-body">
              <p>{modalData.abstract}</p>
              <div className="row">
                <div className="col-lg-6">
                  <p>
                    <b>Total Funding</b>:{" "}
                    {modalData.total_funding?.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </p>
                </div>
                <div className="col-lg-6">
                  <p>
                    <b>Start Date</b>:{" "}
                    {moment(modalData.start_date).format("Do MMM, YYYY")}
                  </p>
                </div>
                <div className="col-lg-6">
                  <p>
                    <b>End Date</b>:{" "}
                    {moment(modalData.end_date).format("Do MMM, YYYY")}
                  </p>
                </div>
                <div className="col-lg-6">
                  <p>
                    <b>Duration</b>:{" "}
                    {moment(modalData.end_date).diff(
                      moment(modalData.start_date),
                      "months"
                    )}{" "}
                    months ||{" "}
                    {moment(modalData.end_date).diff(
                      moment(modalData.start_date),
                      "days"
                    )}{" "}
                    days
                  </p>
                </div>
                <div className="col-lg-6">
                  <p>
                    <b>Grant Agency</b>: {modalData.api_service}
                  </p>
                </div>
                {modalData.keywords ? (
                  <div className="col-lg-6">
                    <p>
                      <b>Keyword</b>:{" "}
                      {modalData.keywords.map((k) => k.keyword).join(",")}
                    </p>
                  </div>
                ) : null}
              </div>
              <small className="mb-3 d-inline-block">
                Approximately:{" "}
                {Math.ceil(
                  modalData.total_funding /
                    moment(modalData.end_date).diff(
                      moment(modalData.start_date),
                      "days"
                    )
                )?.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}{" "}
                / Day
              </small>
              {modalData.status === 1 ? (
                <p>
                  <span className="badge bg-primary">SIGNED</span>
                </p>
              ) : (
                <p>
                  <span className="badge bg-success">CLOSED</span>
                </p>
              )}
              {!modalData.relevance_score ? (
                <p className="relevance_score">
                  <span className={`badge bg-secondary`}>
                    Keyword Relevance Score: N/A
                  </span>
                </p>
              ) : (
                <p className="relevance_score">
                  <span
                    className={`badge ${
                      modalData.relevance_score > 20
                        ? "bg-primary"
                        : "bg-danger"
                    }`}
                  >
                    Keyword Relevance Score: {modalData.relevance_score}%
                  </span>
                </p>
              )}
            </div>
            <div className="card-footer">
              <div className="d-flex align-items-center justify-content-between">
                <button
                  className="btn btn-outline-success w-100 me-2"
                  onClick={() => actionButton(1, modalData.id)}
                >
                  Approve
                </button>
                <button
                  className="btn btn-outline-danger w-100"
                  onClick={() => actionButton(2, modalData.id)}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </main>
  );
};

export default Home;
