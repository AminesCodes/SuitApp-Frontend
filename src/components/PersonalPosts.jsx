import React from 'react'
import axios from 'axios'

import PostThumbnail from './PostThumbnail'
import PostLightBox from './PostLightBox'
import UploadPost from './UploadPost'

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const handleNetworkErrors = err => {
    if (err.response) {
        if (err.response.data.message) {
            toast.error(err.response.data.message,
                { position: toast.POSITION.TOP_CENTER });
        } else {
            toast.error(`${err.response.data}: ${err.response.status} - ${err.response.statusText}`,
            { position: toast.POSITION.TOP_CENTER });
            console.log('Error', err);
        }
    } else if (err.message) {
        toast.error(err.message,
            { position: toast.POSITION.TOP_CENTER });
    } else {
        toast.error('Sorry, an error occurred, try again later',
            { position: toast.POSITION.TOP_CENTER });
        console.log('Error', err);
    }
}


export default class PersonalPosts extends React.Component {
    state = {
        userId: this.props.userId,
        userPosts: [],
        targetPostId: 0,
        targetPost: null,
        targetPostTitle: '',
        targetPostCaption: '',
        displayTargetPost: false,
    }

    getUserPosts = async (userId) => {
        if (userId) {
            try {
                const { data } = await axios.get(`http://localhost:3129/posts/userid/${userId}`)
                this.setState({ userPosts: data.payload })
            } catch (err) {
                handleNetworkErrors(err)
            }
        }
    }

    componentDidMount() {
        if (this.props.handleTabSelection) {
            this.props.handleTabSelection(3)
        }
        this.getUserPosts(this.state.userId)
    }

    async componentDidUpdate(prevProps, prevState) {
        if (prevProps.userId !== this.props.userId) {
            await this.setState({userId: this.props.userId, displayTargetPost: false})
            await this.getUserPosts(this.state.userId)
        }
    }


    handlePicClick = (index) => {
        this.setState({
            targetPostId: this.state.userPosts[index].id,
            targetPost: this.state.userPosts[index],
            targetPostTitle: this.state.userPosts[index].title,
            targetPostCaption: this.state.userPosts[index].caption,
            displayTargetPost: true
        })
    }

    handleClosePost = () => {
        this.setState({ displayTargetPost: false })
    }

    handleForm = async (event, postId) => {
        event.preventDefault()

        try {
            const pw = sessionStorage.getItem('Suit_App_KS')
            const uId = sessionStorage.getItem('Suit_App_UId')
            const requestBody = {
                password: pw,
                currUserId: uId,
                title: this.state.targetPostTitle,
                caption: this.state.targetPostCaption,
            }
            const { data } = await axios.patch(`http://localhost:3129/posts/edit/${postId}`, requestBody)
            if (data.status === 'success') {
                this.getUserPosts(this.state.userId)
                toast.success('✓',
                    { position: toast.POSITION.BOTTOM_CENTER });
            }
        } catch (err) {
            handleNetworkErrors(err)
        }
    }

    handleTitleInput = event => {
        this.setState({targetPostTitle: event.target.value})
    }

    handleCaptionInput = event => {
        this.setState({targetPostCaption: event.target.value})
    }

    handleDeletePost = async (postId) => {
        try {
            const pw = sessionStorage.getItem('Suit_App_KS')
            const user = {
                password: pw,
                currUserId: this.state.userId,
            }
            const { data } = await axios.patch(`http://localhost:3129/posts/delete/${postId}`, user)
            if (data.status === 'success') {
                this.getUserPosts(this.state.userId)
                this.setState({displayTargetPost: false})
            }
        } catch (err) {
            handleNetworkErrors(err)
        }
    }

    reloadPosts = () => {
        this.getUserPosts(this.state.userId)
    }
    
    // ##################### RENDER ######################
    render() {
        let post = null
        if (this.state.displayTargetPost) {
            post = <PostLightBox userId={this.state.userId} postId={this.state.targetPostId} allowedToEdit={this.props.allowedToEdit} title={this.state.targetPostTitle} caption={this.state.targetPostCaption} image={this.state.targetPost.image_url} timestamp={this.state.targetPost.time_created} handleClosePost={this.handleClosePost} handleDeletePost={this.handleDeletePost} handleTitleInput={this.handleTitleInput} handleCaptionInput={this.handleCaptionInput} handleForm={this.handleForm}/>
        }

        let uploadPost = null
        if (this.props.allowedToEdit) {
            uploadPost = <UploadPost userId={this.state.userId} reloadPosts={this.reloadPosts}/>
        }
        return (
            <div className={`container tab-pane ${this.props.active}`}>
                <div className='d-flex flex-wrap'>
                    {uploadPost}
                    {this.state.userPosts.map((post, index) => <PostThumbnail index={index} key={post.image_url+post.time_created} id={post.id} image={post.image_url} tags={post.hashtag_str} handlePicClick={this.handlePicClick}/>)}
                </div>
                {post}
            </div>
        )
    }
}