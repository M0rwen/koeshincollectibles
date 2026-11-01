import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import 'react-toastify/dist/ReactToastify.css';

import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'

import api from '../../Utils/api'
import { errMsg, successMsg } from '../../Utils/helpers';
import { DataGrid, } from '@mui/x-data-grid'

const UsersList = () => {
    const [loading, setLoading] = useState(true)
    const [allUsers, setAllUsers] = useState([])
    const [showDeleted, setShowDeleted] = useState(false)
    const listUsers = async () => {
        setLoading(true)
        try {
            const { data } = await api.get(`${import.meta.env.VITE_API}/admin/users${showDeleted ? '?deleted=true' : ''}`)
            setAllUsers(data.users)
        } catch (error) {
            errMsg(error.response?.data?.message || 'Unable to load users')
        } finally {
            setLoading(false)
        }
    }
    const deleteUser = async (id) => {
        try {
            const { data } = await api.delete(`${import.meta.env.VITE_API}/admin/user/${id}`)
            if (data.success) {
                setAllUsers(users => users.filter(user => user._id !== id))
                successMsg('User moved to Deleted')
            }
        } catch (error) {
            errMsg(error.response?.data?.message || 'Unable to delete user')
        }
    }

    const restoreUser = async (id) => {
        try {
            await api.put(`${import.meta.env.VITE_API}/admin/user/${id}/restore`)
            successMsg('User restored successfully')
            await listUsers()
        } catch (error) {
            errMsg(error.response?.data?.message || 'Unable to restore user')
        }
    }

    useEffect(() => {
        let isCurrent = true
        api.get(`${import.meta.env.VITE_API}/admin/users${showDeleted ? '?deleted=true' : ''}`)
            .then(({ data }) => {
                if (isCurrent) setAllUsers(data.users)
            })
            .catch(error => {
                if (isCurrent) errMsg(error.response?.data?.message || 'Unable to load users')
            })
            .finally(() => {
                if (isCurrent) setLoading(false)
            })
        return () => {
            isCurrent = false
        }
    }, [showDeleted])


    const deleteUserHandler = (id) => {
        deleteUser(id)
    }

    const columns = [
        {
            field: 'id',
            headerName: 'User ID',
            flex: 1,
            renderCell: (params) => <span style={{ wordBreak: 'break-all' }}>{params.value}</span>
        },
        {
            field: 'name',
            headerName: 'Name',

            width: 130,
            align: 'right',
            headerAlign: 'right'
        },
        {
            field: 'email',
            headerName: 'Email',
            width: 120,
            align: 'right',
            headerAlign: 'right'
        },
        {
            field: 'role',
            headerName: 'Role',
            width: 120,
            align: 'right',
            headerAlign: 'right'
        },

        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            filterable: false,
            renderCell: (params) => (

                <>
                    {console.log(params)}
                    {showDeleted
                        ? <button className="btn btn-success py-1 px-2" onClick={() => restoreUser(params.id)}>Restore</button>
                        : <>
                            <Link to={`/admin/user/${params.id}`} className="btn btn-primary py-1 px-2">
                                <i className="fa fa-pencil"></i>
                            </Link>
                            <button className="btn btn-danger py-1 px-2 ml-2" onClick={() => deleteUserHandler(params.id)}>
                                <i className="fa fa-trash"></i>
                            </button>
                        </>}
                </>
            )
        }
    ];
    const rows = allUsers.map(user => ({
        id: user._id,
        name: user.name,

        email: user.originalEmail || user.email,
        role: user.role,
    }));

    return (
        <>
            <MetaData title={'All Users'} />
            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>
                <div className="col-12 col-md-10">
                    <>
                        <h1 className="my-5">All Users</h1>
                        {loading ? <Loader /> : (
                            <>
                                <button
                                    type="button"
                                    className={`btn mb-3 ${showDeleted ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => {
                                        setLoading(true)
                                        setShowDeleted(value => !value)
                                    }}
                                >
                                    {showDeleted ? 'Show Active Users' : 'Show Deleted Users'}
                                </button>
                                <div style={{ width: '100%' }}>
                                    <DataGrid
                                        rows={rows}
                                        columns={columns}

                                        pageSize={5}
                                        rowsPerPageOptions={[5, 10, 25]}
                                        disableSelectionOnClick
                                        getRowId={(row) => row.id}
                                        showToolbar
                                    />
                                </div>
                            </>
                        )}
                    </>
                </div>
            </div>
        </>
    )
}

export default UsersList
