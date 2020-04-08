import React, { useState, useEffect } from "react"
import "./styles.scss"
import styled from "styled-components"

const PageWrapper = styled.div`
  margin: 5%;
  .title {
    text-align: center;
    padding-bottom: 2%;
  }
`

const NewEntryFormCardWrapper = styled.div``

const LeaderboardWrapper = styled.div`
  .first {
    font-weight: bold;
  }
`

const ActivityFeedWrapper = styled.div`
  div.table-wrapper {
    /* overflow: hidden; */
    overflow-y: scroll;
    height: 19rem;
  }
`

const NewEntryFormCard = ({ entries, users, update }) => {
  const [entrySet, setEntrySet] = useState([])

  const getEntries = async () => {
    await fetch(
      "https://api.airtable.com/v0/appf4ukXR0H8zxSMM/entry?api_key=keywRpVDiUGP5S788"
    )
      .then(resp => resp.json())
      .then(data => {
        //.log(data)
        setEntrySet(data.records)
      })
  }

  useEffect(() => {
    getEntries()
  }, [entrySet])
  const [form, setForm] = useState({
    name: "Select name",
    activity: "Select activity",
    pin: 0,
  })

  const handleChange = input => event => {
    setForm({ ...form, [input]: event.target.value })
  }

  const addDays = (date, days) => {
    var result = new Date(date)
    result.setDate(result.getDate() + days)
    result.setHours(23, 59, 59, 0)
    return result
  }

  const handleSubmit = async event => {
    event.preventDefault()

    if (
      form.name !== "Select name" &&
      form.activity !== "Select activity" &&
      form.pin !== 0
    ) {
      let curr_user = users.filter(user => {
        return user.fields.name === form.name
      })
      if (curr_user) {
        curr_user = curr_user[0]
      } else {
        console.log("error")
      }
      console.log(curr_user.fields.pin)
      console.log(form.pin)
      console.log(curr_user)

      if (form.pin != curr_user.fields.pin) {
        console.log("pin mismatch")
        return
      }
      let data = {
        records: [
          {
            id: curr_user.id,
          },
        ],
      }

      let curr_fields = {}
      if (curr_user.fields.hasOwnProperty("last_activity")) {
        let adjusted_activity_date = addDays(curr_user.fields.last_activity, 1)
        let curr_date = new Date()
        console.log(curr_date)
        console.log(adjusted_activity_date)
        if (adjusted_activity_date >= curr_date) {
          curr_fields.streak = curr_user.fields.streak + 1
          curr_fields.total_score = curr_user.fields.total_score + 200
        } else {
          curr_fields.streak = 0
          curr_fields.total_score = curr_user.fields.total_score + 100
        }
      } else {
        curr_fields.streak = curr_user.fields.streak + 1
        curr_fields.total_score = curr_user.fields.total_score + 100
      }

      data.records[0].fields = { ...curr_fields }

      try {
        await fetch(
          "https://api.airtable.com/v0/appf4ukXR0H8zxSMM/users?api_key=keywRpVDiUGP5S788",
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        )

        await fetch(
          "https://api.airtable.com/v0/appf4ukXR0H8zxSMM/entries?api_key=keywRpVDiUGP5S788",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              records: [
                {
                  fields: {
                    date: new Date(),
                    type: form.activity,
                    user: [`${curr_user.id}`],
                  },
                },
              ],
            }),
          }
        )

        update(Math.random)
        window.location.reload()
      } catch (err) {
        console.log("error")
      }
    } else {
      console.log("did not do anything")
    }
  }

  return (
    <NewEntryFormCardWrapper>
      <div className="container">
        <div className="card">
          <header className="card-header">
            <p className="card-header-title is-centered">New Activity</p>
          </header>
          <div className="card-content">
            <div className="content">
              <div className="field">
                <label className="label">Name</label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select value={form.name} onChange={handleChange("name")}>
                      <option>Select name</option>
                      {users !== [] ? (
                        users.map((user, index) => {
                          if (user.fields.name) {
                            return (
                              <option key={index}>{user.fields.name}</option>
                            )
                          }
                        })
                      ) : (
                        <></>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <div className="field">
                <label className="label">Pin</label>
                <div className="control">
                  <input
                    className="input"
                    type="number"
                    placeholder="Normal input"
                    value={form.pin}
                    onChange={handleChange("pin")}
                  />
                </div>
              </div>
            </div>

            <div className="field">
              <label className="label">Activity</label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    value={form.activity}
                    onChange={handleChange("activity")}
                  >
                    <option>Select activity</option>
                    {entrySet !== [] ? (
                      entrySet.map((entry, index) => {
                        if (entry !== null) {
                          return (
                            <option key={index}>{entry.fields.name}</option>
                          )
                        }
                      })
                    ) : (
                      <></>
                    )}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              onClick={handleSubmit}
              className="button is-primary is-fullwidth"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </NewEntryFormCardWrapper>
  )
}

const ActivityFeed = ({ users, entries }) => {
  const getUser = id => {
    return users.filter(user => {
      return user.id === id
    })
  }

  const RenderUserActivity = () => {
    if (entries !== []) {
      return (
        <tbody>
          {entries.map((entry, index) => {
            if (entry.fields.user[0]) {
              const match_user = getUser(entry.fields.user[0])[0]
              //console.log(match_user)
              if (match_user) {
                const user_name = match_user.fields.name
                const entry_date = new Date(
                  entry.fields.date
                ).toLocaleDateString()
                return (
                  <tr key={index}>
                    <td>{user_name}</td>
                    <td>{entry.fields.type}</td>
                    <td>{entry_date}</td>
                    {/* <td>{user.fields.streak}</td> */}
                  </tr>
                )
              }
            }
          })}
        </tbody>
      )
    } else {
      return <></>
    }
  }
  return (
    <ActivityFeedWrapper>
      <div className="container">
        <div className="card">
          <header className="card-header">
            <p className="card-header-title is-centered">Activity Feed</p>
          </header>
          <div className="card-content">
            <div className="content">
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Activity</th>
                      <th>Date</th>
                      {/* <th>Streak</th> */}
                    </tr>
                  </thead>
                  <RenderUserActivity />
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ActivityFeedWrapper>
  )
}

const Leaderboard = ({ users }) => {
  const RenderLeaderBoard = () => {
    if (users) {
      return (
        <tbody>
          {users.map((user, index) => {
            if (user.fields.name) {
              return (
                <tr key={index} className={index + 1 === 1 ? "first" : "rest"}>
                  <td>{index + 1}</td>
                  <td>{user.fields.name}</td>
                  <td>{user.fields.total_score}</td>
                  {/* <td>{user.fields.streak}</td> */}
                </tr>
              )
            }
          })}
        </tbody>
      )
    } else {
      return <></>
    }
  }

  return (
    <LeaderboardWrapper>
      <div className="container">
        <div className="card">
          <header className="card-header">
            <p className="card-header-title is-centered">Leaderboard</p>
          </header>
          <div className="card-content">
            <div className="content">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Points</th>
                    {/* <th>Streak</th> */}
                  </tr>
                </thead>
                <RenderLeaderBoard />
              </table>
            </div>
          </div>
        </div>
      </div>
    </LeaderboardWrapper>
  )
}

export default () => {
  const [users, setUsers] = useState([])
  const [entries, setEntries] = useState([])
  const [update, setUpdate] = useState(undefined)
  const fetchUsers = async () => {
    try {
      await fetch(
        "https://api.airtable.com/v0/appf4ukXR0H8zxSMM/users?api_key=keywRpVDiUGP5S788"
      )
        .then(resp => resp.json())
        .then(data => {
          let sorted = data.records.sort((a, b) => {
            return (
              parseFloat(b.fields.total_score) -
              parseFloat(a.fields.total_score)
            )
          })
          setUsers(sorted)
        })
    } catch (err) {
      console.log(err)
    }
  }

  const fetchEntries = async () => {
    try {
      await fetch(
        "https://api.airtable.com/v0/appf4ukXR0H8zxSMM/entries?api_key=keywRpVDiUGP5S788"
      )
        .then(resp => resp.json())
        .then(data => {
          let sorted = data.records.sort((a, b) => {
            const a_date = new Date(a.fields.date)
            const b_date = new Date(b.fields.date)
            return b_date - a_date
          })
          setEntries(sorted)
        })
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchEntries()
  }, [update])
  return (
    <PageWrapper>
      <h1 className="title">Markaz Crew 30 Day Challenges</h1>
      <div className="columns is-desktop">
        <div className="column">
          <Leaderboard users={users} />
        </div>

        <div className="column">
          <ActivityFeed users={users} entries={entries} />
        </div>
        <div className="column">
          <NewEntryFormCard
            entries={entries}
            users={users}
            update={setUpdate}
          />
        </div>
      </div>
    </PageWrapper>
  )
}
