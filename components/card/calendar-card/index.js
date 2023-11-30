Component({
  /**
   * 组件的属性列表
   */
  properties: {
    dateInfo: Object,
    calendarInfoList: Array,
    isCalendarCardLoading: Boolean,
  },

  /**
   * 组件的初始数据
   */
  data: {
    daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  },

  /**
   * 数据监听器
  */
  observers: {
    'calendarInfoList': function (calendarInfoList) {
      if (this.data.isCalendarCardLoading) return
      
      this.setData({ todayDay: this.data.dateInfo.dayIndex, chosenDay: this.data.dateInfo.dayIndex, isDarkMode: getApp().globalData.isDarkMode })
      // console.log(this.data.chosenDay)
      // console.log(this.data.todayDay)
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 监听方块点击事件
     *  
     * @event
    */
    onBlock: function (e) {
      let dayIndex = e.currentTarget.dataset.index

      this.setData({ chosenDay: dayIndex })
      this.triggerEvent('calendarCardEvent', { type: 'changeDay', dayIndex: dayIndex })
    },

    /**
     * 监听上个月事件
     *  
     * @event
    */
    onPrevMonth: function (e) {
      this.triggerEvent('calendarCardEvent', { type: 'prevMonth' })
    },

    /**
     * 监听下个月事件
     *  
     * @event
    */
    onNextMonth: function (e) {
      this.triggerEvent('calendarCardEvent', { type: 'nextMonth' })
    },
  }
})
