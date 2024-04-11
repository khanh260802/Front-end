"use client";
import React, { use, useContext, useEffect, useState } from "react";
import "./styles.scss";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/Button";
import userApis from "@/apis/userApis";
import UserConversationApi from "@/apis/userConversationApi";
import FriendRequest from "@/apis/friendRequest";
import { AuthContext } from "@/context/AuthProvider";
import { SocketContext } from "@/context/SocketProvider";
import SearchIcon from "@mui/icons-material/Search";
import GroupAddSharpIcon from "@mui/icons-material/GroupAddSharp";
import PersonAddAltSharpIcon from "@mui/icons-material/PersonAddAltSharp";
import { Col, Input, Row, Space, Modal, Divider, Flex } from "antd";
import { MuiTelInput } from "mui-tel-input";
import ModalConfirmAddFriend from "@/components/ModalConfirmAddFriend";
import openNotificationWithIcon from "@/components/OpenNotificationWithIcon";
import PhotoOutlinedIcon from "@mui/icons-material/PhotoOutlined";
import { ca } from "date-fns/locale";
import { useSocket } from "../../../context/SocketProvider";
import ModalProfileUser from "@/components/ModalProfileUser";
import { set } from "date-fns";

const Layout = ({ children }) => {
  const router = useRouter();
  const currentUser = React.useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(undefined);
  const [chatReceived, setChatReceived] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [userFind, setUserFind] = useState(undefined);
  const [number, setNumber] = useState("");
  const [openModalCreateGroup, setOpenModalCreateGroup] = useState(false);
  const [userProfile, setUserProfile] = useState({});
  const [openModalAddFriend, setOpenModalAddFriend] = useState(false);
  const [openModalConfirmAddFriend, setOpenModalConfirmAddFriend] = useState(false);
  const {socket} = useSocket(); 
  const [newConversation, setNewConversation] = useState(null);
  const [showModalProfile, setShowModalProfile] = useState(false);
  const handleRouteToDetailConversation = (item) => {
    setCurrentConversation(item);
    console.log(item.conversationId);
    router.push(`/tinNhan/${item.conversationId}`);
  };

  useEffect(() => {
    socket.on("getMessage", (chat) => {
      setChatReceived(chat);
    });
    socket.on("newConversation", (conversation) => {
      console.log("newConversation: ")
      console.log(conversation)
      setNewConversation(conversation);
    }); 

    const fetchData = async () => {
      const userConversations =
        await UserConversationApi.getUserConversationByUserId(currentUser?.uid);
      setConversations(userConversations.conversations);
      // console.log(userConversations.conversations);
      const user1 = await userApis.getUserById(currentUser.uid);
      setUser(user1);
    };

    fetchData();
  }, []);

  useEffect(() => { 
    if (newConversation) {
      setConversations([newConversation, ...conversations]);
    }
  }, [newConversation])
  useEffect(() => {
    // console.log(conversations);
    // console.log(chatReceived);
    if (chatReceived) {
      console.log(chatReceived);
      const conversation = conversations.find(
        (item) => item.conversationId === chatReceived.conversationId
      );

      conversation.lastMess.content = chatReceived.content;
      conversation.lastMess.createdAt = chatReceived.createdAt;
      conversation.lastMess.senderId = chatReceived.senderInfo._id;

      setConversations([
        conversation,
        ...conversations.filter(
          (item) => item.conversationId !== chatReceived.conversationId
        ),
      ]);
    }
  }, [chatReceived]);

  const getUserFriend = async () => {
    let numberNew = number.split(" ");
    numberNew[1][0] === "0" && (numberNew[1] = numberNew[1].slice(1));
    console.log(numberNew.join(""));
    const resp = await FriendRequest.getFriendByNumber(numberNew.join(""));
    if (resp?.name !== undefined) {
      const respCheck = await FriendRequest.checkFriend(
        currentUser.uid,
        resp._id
      );
      resp.state = respCheck;
      setUserFind(resp);
    } else setUserFind(undefined);
  };

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     getUserFriend();
  //   }, 300);
  //   return () => clearTimeout(timer);
  // }, [number]);

  const filteredConversations = conversations.sort((b,a)=> new Date(a.lastMess.createdAt) - new Date(b.lastMess.createdAt))?.filter((item) => {
    const searchValue = searchTerm.toLowerCase();
    if (item) {
      const userName = item.user?.name || "";
      const groupName = item.name || "";
      return (
        userName.toLowerCase().includes(searchValue) ||
        groupName.toLowerCase().includes(searchValue)
      );
    }
    return false;
  });

  const formatTimeDifference = (createdAt) => {
    const currentTime = new Date();
    const differenceInSeconds = Math.floor((currentTime - createdAt) / 1000);
    if (differenceInSeconds < 60) {
      return `${differenceInSeconds} giây`;
    } else if (differenceInSeconds < 3600) {
      const minutes = Math.floor(differenceInSeconds / 60);
      return `${minutes} phút`;
    } else if (differenceInSeconds < 86400) {
      const hours = Math.floor(differenceInSeconds / 3600);
      return `${hours} giờ`;
    } else {
      const days = Math.floor(differenceInSeconds / 86400);
      return `${days} ngày`;
    }
  };

  const openModelAddFriend = () => {
    setOpenModalAddFriend(true);
  };

  const openModelCreateGroup = () => {
    setOpenModalCreateGroup(true);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const checkFriendState = (state) => {
    switch (state) {
      case "pending1":
        return (
          <Button
            padding="5px 12px"
            margin="0px"
            bgColorHover="#DAE9FF"
            border="1px solid #0068FF"
            color="#0068FF"
            fontSize="14px"
            onClick={(e) => {
              e.stopPropagation();
              FriendRequest.cancalRequest(currentUser.uid + "-" + userFind._id);
              setUserFind({ ...userFind, state: "nofriend" });
              openNotificationWithIcon(
                "success",
                "Cancel request",
                "Cancel request to friend"
              );
            }}
          >
            Cancel request
          </Button>
        );
      case "pending2":
        return (
          <Button
            padding="5px 18px"
            margin="0px"
            bgColorHover="#DAE9FF"
            border="1px solid #0068FF"
            color="#0068FF"
            onClick={(e) => {
              e.stopPropagation();
              openNotificationWithIcon(
                "success",
                "Accept",
                "Accept friend request"
              );
            }}
          >
            Accept
          </Button>
        );
      case "declined1":
        return "";
      case "declined2":
      case "nofriend":
        return (
          <Button
            padding="5px 18px"
            margin="0px"
            bgColorHover="#DAE9FF"
            border="1px solid #0068FF"
            color="#0068FF"
            onClick={(e) => {
              e.stopPropagation();
              setOpenModalConfirmAddFriend(true);
            }}
          >
            Add friend
          </Button>
        );

      case "accepted":
        return (
          <Button
            padding="5px 18px"
            margin="0px"
            bgColorHover="#DAE9FF"
            border="1px solid #0068FF"
            color="#0068FF"
            onClick={(e) => {
              e.stopPropagation();
              openNotificationWithIcon(
                "success",
                "Calling",
                "Calling to friend"
              );
            }}
          >
            Call
          </Button>
        );
    }
  };

  const buttonAddFriend = ({ key, findGroup, item }) => {
    return (
      <Button
        width="100%"
        key={key}
        onClick={() => {
          setShowModalProfile(true);
          setUserFind(item);
        }}
      >
        <Row justify={"space-around"} style={{ width: "100%" }}>
          <Col flex={"60px"}>
            <img
              className="avatar-img"
              src={
                item?.avatar ||
                "https://firebasestorage.googleapis.com/v0/b/zalo-78227.appspot.com/o/avatarDefault.jpg?alt=media&token=2b2922bb-ada3-4000-b5f7-6d97ff87becd"
              }
              alt=""
              width={50}
              height={50}
              style={{ borderRadius: "50%", marginRight: "5px" }}
            />
          </Col>
          <Col
            flex={"auto"}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-around",
              alignItems: "flex-start",
            }}
          >
            <h4>{item?.name}</h4>
            {findGroup ? (
              <p>In group a</p>
            ) : (
              <p>
                Phone number: <span>{number}</span>
              </p>
            )}
          </Col>
          <Col
            flex={"160px"}
            style={{
              display: "flex",
              justifyContent: "end",
              alignItems: "center",
            }}
          >
            {checkFriendState(item.state)}
          </Col>
        </Row>
      </Button>
    );
  };

  const handleCloseModal = () => {
    setShowModalProfile(false);
  };

  return (
    <>
      <div className="nameUser">
        <p style={{ fontSize: "14px" }}>ZoLa - {user?.name}</p>
      </div>
      <div className="tinNhan">
        <div className="conversations">
          <Row
            style={{
              width: "100%",
              marginBottom: "5px",
              zIndex: 1,
              position: "sticky",
              top: 0,
            }}
            justify={"center"}
          >
            <Col span={19}>
              <Input
                size="middle"
                placeholder="Searh"
                value={searchTerm}
                onChange={handleSearchChange}
                prefix={<SearchIcon style={{ fontSize: "20px" }} />}
              />
            </Col>
            <Col span={2}>
              <Button onClick={openModelAddFriend}>
                <PersonAddAltSharpIcon style={{ fontSize: "20px" }} />
              </Button>
            </Col>
            <Col span={2}>
              <Button onClick={openModelCreateGroup}>
                <GroupAddSharpIcon style={{ fontSize: "20px" }} />
              </Button>
            </Col>
          </Row>
          <div
            style={{
              flexGrow: 1,
              overflow: "auto",
              overflowY: "auto",
              overflowX: "hidden",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {filteredConversations
              .sort((b, a) => {
                return (
                  new Date(a.lastMess.createdAt) -
                  new Date(b.lastMess.createdAt)
                );
              })
              ?.map((item) => {
                return (
                  <div
                    key={item.conversationId}
                    className={`userConversation ${
                      currentConversation &&
                      currentConversation.conversationId === item.conversationId
                        ? "active"
                        : ""
                    }`}
                    onClick={() => handleRouteToDetailConversation(item)}
                  >
                    <div className="avatar">
                      <img
                        className="avatar-img"
                        src={
                          item?.user?.avatar ||
                          item?.image ||
                          "https://images.pexels.com/photos/6534399/pexels-photo-6534399.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                        }
                        alt=""
                        width={60}
                        height={60}
                      />
                    </div>
                    <div className="info" style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          className="name"
                          style={{ fontWeight: "bold", fontSize: "16px" }}
                        >
                          {item?.user?.name || item?.name}
                        </div>
                        <div>
                          {item.lastMess && (
                            <span
                              style={{
                                fontSize: "13px",
                                fontWeight: "normal",
                              }}
                            >
                              {formatTimeDifference(
                                new Date(item.lastMess.createdAt)
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="lastMess">
                        {item.type === "couple" &&
                          (item.lastMess?.senderId === currentUser?.uid
                            ? "Bạn: "
                            : item?.user?.name + ": ")}
                        {item.type === "group" &&
                          (item.lastMess?.senderId === currentUser?.uid
                            ? "Bạn: "
                            : item?.member.find(
                                (i) => i._id === item.lastMess.senderId
                              ).name + ": ")}
                        {item.lastMess?.content.text
                          ? item.lastMess?.content.text
                          : item.lastMess?.content.file
                          ? `📄${item.lastMess?.content.file.name}`
                          : `🏞️Photo`}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        {children}
      </div>

      <Modal
        open={openModalAddFriend}
        title={<h3>Add friend</h3>}
        onCancel={() => {
          setOpenModalAddFriend(false);
          setUserFind(undefined);
          setNumber("");
        }}
        footer={null}
        width={"33%"}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderTop: "1px solid #A9ACB0",
            paddingTop: "10px",
            maxHeight: "55vh",
            minHeight: "55vh",
            overflowY: "auto",
            overflowX: "hidden",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <MuiTelInput
            size="small"
            defaultCountry={"VN"}
            value={number}
            onChange={setNumber}
            onKeyUp={(e) => {
              if (e.key === "Enter") getUserFriend();
            }}
            fullWidth
            id="phone"
            placeholder="Phone number"
            name="phone"
            style={{
              position: "sticky",
              top: 0,
              backgroundColor: "white",
              marginBottom: "10px",
              zIndex: 1,
            }}
          />
          <div
            style={{
              flexGrow: 1,
              overflow: "auto",
              overflowY: "auto",
              overflowX: "hidden",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {userFind !== undefined && (
              <div>
                <p>Find friend via phone number</p>
                <div>
                  {buttonAddFriend({
                    key: Date.now().toString(),
                    findGroup: false,
                    item: userFind,
                  })}
                </div>
              </div>
            )}
            {/* <div>
              <p>You may know</p>
              <div>
                {Array.from({ length: 1 }, (_, i) =>
                  buttonAddFriend({
                    key: i,
                    findGroup: true,
                    item: { name: "a" },
                  })
                )}
              </div>
            </div> */}
          </div>
          <Flex
            justify="end"
            gap={5}
            style={{
              borderTop: "1px solid #A9ACB0",
              marginTop: "10px",
              paddingTop: "5px",
              position: "sticky",
              bottom: 0,
            }}
          >
            <Button
              key="back"
              onClick={() => {
                setOpenModalAddFriend(false);
                setUserFind(undefined);
                setNumber("");
              }}
              bgColor="#DFE2E7"
              bgColorHover="#C7CACF"
              color="black"
              padding="10px 25px"
            >
              CANCEL
            </Button>
            <Button
              key="submit"
              bgColor="#0068FF"
              bgColorHover="#0063F2"
              color="white"
              padding="10px 25px"
              onClick={() => getUserFriend()}
            >
              SEARCH
            </Button>
          </Flex>
        </div>
      </Modal>

      <ModalProfileUser
        isOpen={showModalProfile}
        onClose={handleCloseModal}
        user={userFind}
      />

      {/* Confirm add friend */}
      <ModalConfirmAddFriend
        show={openModalConfirmAddFriend}
        handleClose={() => setOpenModalConfirmAddFriend(false)}
        // handleOK={() => setOpenModalConfirmAddFriend(false)}
        user={currentUser}
        userFind={userFind}
        setUserFind={setUserFind}
      />
    </>
  );
};

export default Layout;
