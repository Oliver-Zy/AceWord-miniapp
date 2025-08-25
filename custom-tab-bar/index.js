const app = getApp()

Component({
  data: {
    isDarkMode: false,
    show: true,
    selected: 0,
    color: "#86909C",
    selectedColor: "#2C3153",
    list: [{
        pagePath: "/pages/index/index",
        iconPath: "../images/tab-bars/homepage.png",
        selectedIconPath: "../images/tab-bars/homepage-chosen.png",
        text: "首页"
      }, {
        pagePath: "/pages/calendar/calendar",
        iconPath: "../images/tab-bars/calendar.png",
        selectedIconPath: "../images/tab-bars/calendar-chosen.png",
        text: "日历"
      },
      // {
      //   pagePath: "/pages/lab/lab",
      //   iconPath: "../images/tab-bars/lab.png",
      //   selectedIconPath: "../images/tab-bars/lab-chosen.png",
      //   text: "工作台"
      // },
      {
        pagePath: "/pages/mine/mine",
        iconPath: "../images/tab-bars/mine.png",
        selectedIconPath: "../images/tab-bars/mine-chosen.png",
        text: "我的"
      }
    ]
  },

  lifetimes: {
    attached: function () {
      this.setData({
        isIOS: app.globalData.isIOS
      })
      if (app.globalData.isDarkMode) {
        this.setData({
          isDarkMode: true,
          color: "#CECFD6",
          selectedColor: "#FFFFFF",
          list: [{
              pagePath: "/pages/index/index",
              iconPath: "../images/tab-bars/homepage-dark.png",
              selectedIconPath: "../images/tab-bars/homepage-chosen-dark.png",
              text: "首页"
            }, {
              pagePath: "/pages/calendar/calendar",
              iconPath: "../images/tab-bars/calendar-dark.png",
              selectedIconPath: "../images/tab-bars/calendar-chosen-dark.png",
              text: "日历"
            },
            // {
            //   pagePath: "/pages/lab/lab",
            //   iconPath: "../images/tab-bars/lab-dark.png",
            //   selectedIconPath: "../images/tab-bars/lab-chosen-dark.png",
            //   text: "工作台"
            // },
            {
              pagePath: "/pages/mine/mine",
              iconPath: "../images/tab-bars/mine-dark.png",
              selectedIconPath: "../images/tab-bars/mine-chosen-dark.png",
              text: "我的"
            }
          ]
        })
      }
    },
  },

  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({
        url
      })
      this.setData({
        selected: data.index
      })
    }
  }
})