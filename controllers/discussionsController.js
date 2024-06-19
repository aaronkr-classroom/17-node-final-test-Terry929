// controllers/discussionsController.js
"use strict";

const Discussion = require("../models/Discussion"), // 사용자 모델 요청
  getDiscussionParams = (body, user) => {
    return {
      title: body.title,
      description: body.description,
      author: user,
      category: body.category,
      tags: body.tags,
    };
  };

module.exports = {
  index: (req, res, next) => {
    Discussion.find()
      .populate("author")
    .exec()
    .then((discussions) => { // index 액션에서만 퀴리 실행
        // 사용자 배열로 index 페이지 렌더링
        res.locals.discussions = discussions; // 응답상에서 사용자 데이터를 저장하고 다음 미들웨어 함수 호출
        next();
      })
      .catch((error) => {
        // 로그 메시지를 출력하고 홈페이지로 리디렉션
        console.log(`Error fetching discussions: ${error.message}`);
        next(error); // 에러를 캐치하고 다음 미들웨어로 전달
      });
  },
  indexView: (req, res) => {
    res.render("discussions/index", {
      page: "discussions",
      title: "All Discussions",
    }); // 분리된 액션으로 뷰 렌더링
  },

  /**
   * 노트: 구독자 컨트롤러에서 index 액션이 getAllSubscribers를 대체한다. main.js에서 액션 관련
   * 라우트 index를 가리키도록 수정하고 subscribers.ejs를 index.ejs로 변경된 점을 기억하자. 이
   * 뷰는 views 폴더 아래 subscribers 폴더에 있어야 한다.
   */

  /**
   * Listing 19.2 (p. 278)
   * userController.js에 액션 생성 추가
   */
  // 폼의 렌더링을 위한 새로운 액션 추가
  new: (req, res) => {
    res.render("discussions/new", {
      page:"discussions",
      title:"New Discussion",
    });
  },

  // 사용자를 데이터베이스에 저장하기 위한 create 액션 추가
  create: (req, res, next) => {
    let discussionParams = getDiscussionParams(req.body);
    // 폼 파라미터로 사용자 생성
    Discussion.create(discussionParams)
      .then((discussion) => {
        res.locals.redirect = "/discussions";
        res.locals.subscriber = discussion;
        next();
      })
      .catch((error) => {
        console.log(`Error saving discussion: ${error.message}`);
        next(error);
      });
  },

  // 분리된 redirectView 액션에서 뷰 렌더링
  redirectView: (req, res, next) => {
    let redirectPath = res.locals.redirect;
    if (redirectPath) res.redirect(redirectPath);
    else next();
  },

  /**
   * 노트: 구독자 컨트롤러에 new와 create 액션을 추가하는 것은 새로운 CRUD 액션을 맞춰
   * getAllSubscribers와 saveSubscriber 액션을 삭제할 수 있다는 의미다. 게다가 홈
   * 컨트롤러에서 할 것은 홈페이지인 index.ejs 제공밖에 없다.
   */

  /**
   * Listing 19.7 (p. 285)
   * userController.js에서 특정 사용자에 대한 show 액션 추가
   */
  show: (req, res, next) => {
    let discussionId = req.params.id; // request params로부터 사용자 ID 수집
    Discussion.findById(req.params.id)
      .populate("author")
      .populate("comments")
      .then((discussion) => {
    discussion.views++;
    discussion.save() // ID로 사용자 찾기
      // .then((discussion) => {
        res.locals.discussion = discussion; // 응답 객체를 통해 다음 믿들웨어 함수로 사용자 전달
        next();
      })
      .catch((error) => {
        console.log(`Error fetching subscriber by ID: ${error.message}`);
        next(error); // 에러를 로깅하고 다음 함수로 전달
      });
  },

  // show 뷰의 렌더링
  showView: (req, res) => {
    res.render("discussions/show", {
      page: "discussion-details",
      title: "Discussion Details",
    });
  },

  /**
   * Listing 20.6 (p. 294)
   * edit와 update 액션 추가
   */
  // edit 액션 추가
  edit: (req, res, next) => {
    // ID로 데이터베이스에서 사용자를 찾기 위한 findById 사용
    Discussion.findById(req.params.id)
      .populate("author")
      .populate("comments")
      .then((discussion) => {
        res.render("subscribers/edit", {
          subscriber: subscriber,
          page: subscriber.name,
          title: "Edit Subscriber",
        }); // 데이터베이스에서 내 특정 사용자를 위한 편집 페이지 렌더링
      })
      .catch((error) => {
        console.log(`Error fetching subscriber by ID: ${error.message}`);
        next(error);
      });
  },

  // update 액션 추가
  update: (req, res, next) => {
    let discussionID = req.params.id,
     discussionParams = getDiscussionParams(req.body);

    Discussion.findByIdAndUpdate(discussionID, {
      $set: discussionParams,
  })
    .populate("author")
    .then((discussion) => {
        res.locals.redirect = `/discussions/${discussionID}`;
        res.locals.discussion = discussion;
        next(); // 지역 변수로서 응답하기 위해 사용자를 추가하고 다음 미들웨어 함수 호출
      })
      .catch((error) => {
        console.log(`Error updating discussion by ID: ${error.message}`);
        next(error);
      });
  },

  /**
   * Listing 20.9 (p. 298)
   * delete 액션의 추가
   */
  delete: (req, res, next) => {
    let  discussionID = req.params.id;
    Discussion.findByIdAndRemove(discussionID) // findByIdAndRemove 메소드를 이용한 사용자 삭제
      .then(() => {
        res.locals.redirect = "/discussions";
        next();
      })
      .catch((error) => {
        console.log(`Error deleting discussion by ID: ${error.message}`);
        next();
      });
  },
};
  /**
   * =====================================================================
   * C: CREATE / 생성
   * =====================================================================
   */
  // 1. new: 액션,
  // 2. create: 액션,
  // 3. redirectView: 액션,
  /**
   * =====================================================================
   * R: READ / 조회
   * =====================================================================
   */
  /**
   * ------------------------------------
   * ALL records / 모든 레코드
   * ------------------------------------
   */
  // 4. index: 액션,
  // 5. indexView: 엑션,
  /**
   * ------------------------------------
   * SINGLE record / 단일 레코드
   * ------------------------------------
   */
  // 6. show: 액션,
  // 7. showView: 액션,
  /**
   * =====================================================================
   * U: UPDATE / 수정
   * =====================================================================
   */
  // 8. edit: 액션,
  // 9. update: 액션,
  /**
   * =====================================================================
   * D: DELETE / 삭제
   * =====================================================================
   */
  // 10. delete: 액션,
