/**
 * @classDescription    Custom selectbox with the option to use jScrollPane
 *                      for a custom scrollbar. Hides the original selectbox off 
 *                      screen so that it will still get picked up as a form element.
 *
 * @version             2.0.0
 *
 * @author              Rob LaPlaca - rob.laplaca@gmail.com
 * @date                04/05/2010
 * @lastUpdate          03/21/2015 
 * @dependency          jScrollPane.js          optional
 *                      jquery.mousewheel.js    optional
 * 
 * @param {Boolean}     options.customScrollbar     whether or not to use jScrollPane to restyle system scrollbar (default false)
 * @param {Function}    options.changeCallback      Function that gets executed on change of the selectbox (default empty function)
 * @param {Function}    options.truncate            Allows the ability to override default truncate method with a custom one
 * @param {Object}      options.scrollOptions       jScrollPane options, refer to jscrollpane documentation for possible options
 *                                                  http://www.kelvinluck.com/assets/jquery/jScrollPane/scripts/jScrollPane.js
 */

(function (factory) {
    'use strict';

    if ( typeof define === 'function' && define.amd ) {
        define([
            'jquery', 
            'jquery.jscrollpane',
            'jquery.mousewheel'
        ], factory);
    } else {
        factory(jQuery);
    }
}(function($) {

    var pluginName = 'customSelect';
    
    var Plugin = function(element, options){
        var self = this,
            cfg = $.extend(true, {
                customScrollbar: true,
                selectbox: $(element),
                changeCallback: function(val) { },
                truncate: function(str) {return str;},
                scrollOptions: {}
            }, options);

        var $document, $customSelect, $selectedValue, 
            $selectValueWrap, $selectList, $dl, $options,
            FOCUSED_CLASS = "focused",
            SELECTED_CLASS = "selected",
            SELECT_OPEN_CLASS = "select-open",
            DISABLED_CLASS = "disabled",
            HOVERED_CLASS = "hovered",
            _useDefaultBehavior = false,
            _isOpen = false,
            _isEnabled = true,
            _isFocused = false,
            _selectedValue = "";

        /**
         * @constructor
         */

        function init() {
            $document = $(document);

            // TODO: don't use userAgent matching to detect defaulting to device specific behavior
            _useDefaultBehavior = navigator.userAgent.match(/iPad|iPhone|Android|IEMobile|BlackBerry/i) ? true : false;

            if( _useDefaultBehavior ) {
                cfg.selectbox.addClass("use-default");
            }

            var selectId = "",
                selectedClass = cfg.selectbox.attr("class");
                
            if ( typeof cfg.selectbox.attr("id") !== 'undefined' ) {
                selectId = 'id="select-'+cfg.selectbox.attr("id")+'"';
            }

            cfg.selectbox.wrap('<div class="customSelect '+selectedClass+'" '+selectId+' />');

            $customSelect = cfg.selectbox.parents(".customSelect");
            $options = cfg.selectbox.find("option");

            var selectListHTML = ['<div class="selectList"><div class="selectListOuterWrap"><div class="selectListInnerWrap"><div class="selectListTop"></div><dl>'];
            selectListHTML.push(_renderOptions());
            selectListHTML.push('</dl><div class="selectListBottom"></div></div></div></div>');

            $customSelect.append('<div class="selectValueWrap"><div class="selectedValue">'+_selectedValue+'</div> <span class="caret"></span> </div>' + selectListHTML.join(""));

            $dl = $customSelect.find("dl");
            $selectedValue = $customSelect.find(".selectedValue");
            $selectValueWrap = $customSelect.find(".selectValueWrap");
            $selectList = $customSelect.find(".selectList");

            $document.on('customSelect.close', self.close);

            _bindEvents();
        }

        /**
         * @private
         */

        function _bindEvents() {
            $selectValueWrap.click(function() {
                if(_isOpen) {
                    cfg.selectbox.focus();
                    self.close();
                } else if(_isEnabled) {
                    if( _useDefaultBehavior ) {
                        cfg.selectbox.focus();
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
                            cfg.selectbox.focus();
                        }
                    }
                }
            });

            cfg.selectbox.focus(function(e) {
                _isFocused = true;
                $customSelect.addClass(FOCUSED_CLASS);
            }).blur(function(e){
                _isFocused = false;
                $customSelect.removeClass(FOCUSED_CLASS);
            });

            cfg.selectbox.change(function(e) {
                _updateValue( $(this).find("option:selected").html() );
            });

            cfg.selectbox.keyup(function(e){
                self.close();
                $options.each(function(i, itm){     
                    if(itm.selected) {
                        self.jumpToIndex(i);
                        return false;
                    }
                });
            });

            _bindHover();
        }

        /**
         * @private
         */

        function _bindHover() {
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
        }

        /**
         * @param {String} val
         * @private
         */

        function _updateValue(val) {
            if($selectedValue.html() != val) {
                $selectedValue.html(_truncate(val));
                cfg.changeCallback(cfg.selectbox.val());
            }
        }

        /** 
         * @returns {String} HTML generated after processing options
         * @private
         */

        function _renderOptions() {
            var optionHTML = [];

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
                    _selectedValue = iconMarkup + _truncate($(itm).html());
                    addlOptClasses = " " + SELECTED_CLASS;
                }

                // Check for disabled options
                if( itm.disabled ) {
                    addlOptClasses += " " + DISABLED_CLASS;
                }

                optionHTML.push('<dd class="option-' + i + ' ' + addlOptClasses + '">' + iconMarkup + itm.innerHTML + '</dd>');
            });

            if($selectedValue && $selectedValue.get(0) !== null) {
                $selectedValue.html(_selectedValue);
            }

            return optionHTML.join("");
        }

        /**
         * @private
         */

        function _setupScrollbar() {
            if ( cfg.customScrollbar ) {
                if ( typeof $.fn.jScrollPane === 'undefined' ) {
                    throw new Error('jScrollPane is required to use the customScrollbar config property');
                }

                // console.log('$dl.outerHeight(): ', $dl.height());
                
                self.scrollpane = $dl.jScrollPane(cfg.scrollOptions);
            }
        }

        /**
         * @param {String} str
         * @returns truncated display string
         * @private
         */

        function _truncate(str) {
            var arr = str.split("</span>");
            var valToTrunc = arr[arr.length - 1];
            arr[arr.length - 1] = "";
            var spans = arr.join("</SPAN>");

            return spans + cfg.truncate(valToTrunc);
        }

        /**
         * @public
         */

        this.sync = function() {
            $options = cfg.selectbox.find("option");
            $dl.html(_renderOptions());
            _bindHover();
            _setupScrollbar();
        };

        /**
         * @public
         */

        this.disable = function() {
            _isEnabled = false;
            $customSelect.addClass(DISABLED_CLASS);
            cfg.selectbox.attr("disabled", "disabled");
        };

        /**
         * @public
         */

        this.enable = function() {
            _isEnabled = true;
            $customSelect.removeClass(DISABLED_CLASS);
            cfg.selectbox.removeAttr("disabled");
        };

        /**
         * @public
         */

        this.close = function() {
            $customSelect.removeClass(SELECT_OPEN_CLASS);
            _isOpen = false;
        };

        /**
         * @public
         */

        this.open = function() {
            $document.trigger('customSelect.close');

            _setupScrollbar();

            $customSelect.addClass(SELECT_OPEN_CLASS);

            if(self.scrollpane) {
                self.scrollpane.data('jsp').scrollToY($customSelect.find(".selected").position().top);
            }

            _isOpen = true;
        };

        /**
         * @param {Number} index
         * @public
         */

        this.jumpToIndex = function(index) {
            cfg.selectbox.get(0).selectedIndex = index;
            $customSelect.find(".selected").removeClass(SELECTED_CLASS);
            $customSelect.find(".option-" + index).addClass(SELECTED_CLASS);
            _updateValue($customSelect.find(".option-" + index).html());
        };

        /**
         * @param {String} value
         * @returns {Number} index of the value
         * @public
         */

        this.jumpToValue = function(value) {
            var index = -1;

            $options.each(function(i) {
                if ( this.innerHTML === value ){
                    index = i;
                    return false;
                }
            });

            if ( index !== -1 ){
                self.jumpToIndex(index);
            }

            return index;
        };

        init();
    };

    $.fn[pluginName] = function(options) {
        return this.each(function() {
            if (!$.data( this, 'plugin_' + pluginName )) {

                $(document).click(function(e) {
                    if($(e.target).parents(".customSelect").size() === 0) {
                        $(document).trigger('customSelect.close');
                    }
                });

                $.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
            }
        });
    };
}));