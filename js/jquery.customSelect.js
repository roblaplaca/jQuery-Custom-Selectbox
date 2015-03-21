;(function($, window, document, undefined) {
    'use strict';

    var pluginName = 'customSelect';
    var defaults = {
        customScrollbar: true,
        zIndex: 100,
        truncate: function(str) { return str; },
        scrollOptions: {}
    };

    var $element, $customSelect, $selectedValue, 
        $selectValueWrap, $selectList, $dl, $options,
        FOCUSED_CLASS = 'focused',
        SELECTED_CLASS = 'selected',
        SELECT_OPEN_CLASS = 'select-open',
        DISABLED_CLASS = 'disabled',
        HOVERED_CLASS = 'hovered',
        _useDefaultBehavior = false,
        _isOpen = false,
        _isEnabled = true,
        _isFocused = false,
        _selectedValue = '';

    function Plugin(element, options) {
        this.element = element;
        this.settings = $.extend( {}, defaults, options );
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    // $customSelect.trigger('change');

    $.extend(Plugin.prototype, {
        init: function () {
            var self = this;
            $element = $(this.element);
            
            // TODO: don't use userAgent matching to detect defaulting to device specific behavior
            _useDefaultBehavior = navigator.userAgent.match(/iPad|iPhone|Android|IEMobile|BlackBerry/i) ? true : false;

            if (_useDefaultBehavior) {
                $element.addClass("use-default");
            }

            var selectId = "",
                selectedClass = $element.attr("class");
                
            if (typeof $element.attr("id") !== "undefined") {
                selectId = 'id="select-' + $element.attr("id") + '"';
            }

            $element.wrap('<div class="customSelect '+selectedClass+'" '+selectId+' />');

            $customSelect = $element.parents(".customSelect");
            $options = $element.find("option");

            var selectListHTML = ['<div class="selectList"><div class="selectListOuterWrap"><div class="selectListInnerWrap"><div class="selectListTop"></div><dl>'];
            selectListHTML.push(this.getOptions());
            selectListHTML.push('</dl><div class="selectListBottom"></div></div></div></div>');

            $customSelect.append('<div class="selectValueWrap"><div class="selectedValue">' + _selectedValue + '</div> <span class="caret"></span> </div>' + selectListHTML.join(''));

            $dl = $customSelect.find("dl");
            $selectedValue = $customSelect.find(".selectedValue");
            $selectValueWrap = $customSelect.find(".selectValueWrap");
            $selectList = $customSelect.find(".selectList");

            $customSelect.width(this.settings.width);
            $dl.width(this.settings.width - 2);

            this.bindEvents();
            this.bindAPI();
        },
        getOptions: function() {
            var optionHTML = [],
                self = this;

            $options.each(function(i, itm) {
                var $this = $(this),
                    optgroup = $this.parents('optgroup'),
                    addlOptClasses = "",
                    iconMarkup = "";

                // render optgroups if present in original select
                if (optgroup.length > 0 && $this.prev().length === 0){
                    optionHTML.push('<dt>'+optgroup.attr('label')+'</dt>');
                }

                // if option has a classname add that to custom select as well
                if(itm.className !== "") {
                    $(itm.className.split(" ")).each(function() {
                        iconMarkup += '<span class="' + this + '"></span>';
                    });
                }

                // add selected class to whatever option is currently active
                if(itm.selected && !itm.disabled) {
                    _selectedValue = iconMarkup + self.truncate($(itm).html());
                    addlOptClasses = " " + SELECTED_CLASS;
                }

                // Check for disabled options
                if( itm.disabled ) {
                    addlOptClasses += " " + DISABLED_CLASS;
                }

                optionHTML.push('<dd class="itm-' + i + ' ' + addlOptClasses + '">' + iconMarkup + itm.innerHTML + '</dd>');
            });

            if($selectedValue && $selectedValue.get(0) !== null) {
                $selectedValue.html(_selectedValue);
            }

            return optionHTML.join('');
        },
        bindEvents: function() {
            var self = this;

            $selectValueWrap.click(function() {
                if (_isOpen) {
                    $element.focus();
                    self.close();
                } else if (_isEnabled) {
                    if (_useDefaultBehavior) {
                        $element.focus();
                    } else {
                        self.open();
                    }
                }
            });

            // delegated events
            $dl.click(function(e) {
                var $target = $(e.target);

                if($target.is("dd") || $target.parents("dd")) {
                    if(e.target.tagName.toLowerCase() != "dd") {
                        $target = $target.parents("dd");
                    }

                    if(!$target.hasClass(DISABLED_CLASS) && $target.get(0)) {
                        self.jumpToIndex($target.get(0).className.split(" ")[0].split("-")[1]);
                        self.close();

                        if( ! _useDefaultBehavior ) {
                            $element.focus();
                        }
                    }
                }
            });

            $element.focus(function(e) {
                _isFocused = true;
                $customSelect.addClass(FOCUSED_CLASS);
            }).blur(function(e){
                _isFocused = false;
                $customSelect.removeClass(FOCUSED_CLASS);
            });

            if( _useDefaultBehavior ) {
                $element.change(function(e) {
                    _updateValue( $(this).find("option:selected").html() );
                });
            }

            $element.keyup(function(e){
                self.close();
                $options.each(function(i, itm){     
                    if(itm.selected) {
                        self.jumpToIndex(i);
                        return false;
                    }
                });
            });

            this.bindHover();
        },
        bindHover: function() {
            var $dds = $(".customSelect dd");
            $dds.off("mouseover");
            $dds.off("mouseout");

            $dds.on("mouseover", function(e) {
                var $target = $(e.target);
                if(e.target.tagName.toLowerCase() != "dd") {
                    $target = $target.parents("dd");
                }
                $target.addClass(HOVERED_CLASS);
            });

            $dds.on("mouseout", function(e) {
                var $target = $(e.target);
                if(e.target.tagName.toLowerCase() != "dd") {
                    $target = $target.parents("dd");
                }
                $target.removeClass(HOVERED_CLASS);
            });
        },
        bindAPI: function() {
            $element.on('sync', this.sync);
            $element.on('enable', this.enable);
            $element.on('disable', this.disable);
            $element.on('close', this.close);
            $element.on('open', this.open);
            $element.on('jumpToIndex', this.jumpToIndex);
            $element.on('jumpToValue', this.jumpToValue);
        },
        sync: function() {
            console.log('sync');
        },
        enable: function() {
            console.log('enable');
        },
        disable: function() {
            console.log('disable');
        },
        open: function() {
            // TODO: add back setup scrollbar
            // this.setupScrollbar();

            $customSelect.addClass(SELECT_OPEN_CLASS);

            if(self.scrollpane) {
                self.scrollpane.data('jsp').scrollToY($customSelect.find(".selected").position().top);
            }

            $customSelect.css({
                "z-index": this.settings.zIndex + 1
            });

            _isOpen = true;
        },
        close: function() {
            $customSelect.removeClass(SELECT_OPEN_CLASS);
            $customSelect.css({"z-index": this.settings.zIndex});
            _isOpen = false;
        },
        jumpToValue: function(e, val) {
            console.log(e);
            console.log('jumpToValue: ', val);
        },
        jumpToIndex: function(e, index) {
            var index = e.isTrigger ? index : e;
            
            $element.selectedIndex = parseInt(index, 10);
            $customSelect.find(".selected").removeClass(SELECTED_CLASS);
            $customSelect.find(".itm-" + index).addClass(SELECTED_CLASS);

            this.updateValue($customSelect.find(".itm-" + index).html());
        },
        updateValue: function(val) {
            if($selectedValue.html() != val) {
                $selectedValue.html(this.truncate(val));
                $element.trigger('change', val);
            }
        },
        truncate: function(str) {
            var arr = str.split("</span>");
            var valToTrunc = arr[arr.length - 1];
            arr[arr.length - 1] = "";
            var spans = arr.join("</SPAN>");

            return spans + this.settings.truncate(valToTrunc);
        }
    });

    $.fn[pluginName] = function(options) {
        return this.each(function() {
            if (!$.data( this, 'plugin_' + pluginName )) {
                $.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
            }
        });
    };

})(jQuery, window, document);