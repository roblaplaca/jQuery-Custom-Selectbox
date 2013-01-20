/**
 * @classDescription	Custom selectbox with the option to use jScrollPane
 *						for a custom scrollbar. Hides the original selectbox off 
 *						screen so that it will still get picked up as a form element.
 *
 * @version				1.0.0
 *
 * @author				Rob LaPlaca - rob.laplaca@gmail.com
 * @date				04/05/2010
 * @lastUpdate			01/20/2013 
 * @dependency			jScrollPane.js			optional
 * 						jquery.mousewheel.js	optional
 * 
 * @param {DOMElement}	options.selectbox			the selectbox that is being customized, REQUIRED (default undefined)
 * @param {Boolean}		options.customScrollbar		whether or not to use jScrollPane to restyle system scrollbar (default false)
 * @param {Number}		options.zIndex				The default z-index of the selectbox. (default 100)
 * @param {Function}	options.changeCallback		Function that gets executed on change of the selectbox (default empty function)
 * @param {Function}	options.manager				Optional reference to a class that manages all instances of the selectbox
 * @param {Object}		options.scrollOptions		jScrollPane options, refer to jscrollpane documentation for possible options
 * 													http://www.kelvinluck.com/assets/jquery/jScrollPane/scripts/jScrollPane.js
 */
(function($){
	var undefined;

	window.SelectBoxManager = function(options){
		var sbs = [], 
			self = this;
			
		$(document).click(function(e) {
			if($(e.target).parents(".customSelect").get(0) == null) {
				self.close();
			}
		});
		
		this.add = function(sb) {
			sbs.push(sb);	
		};
		
		this.close = function() {
			$(sbs).each(function() {
				this.close();					 
			});
		};
	};
	
	var sb_manager = new SelectBoxManager(); 
	
	window.SelectBox = function(options){
		var self = this,
		cfg = $.extend(true, {
			manager: sb_manager,
			customScrollbar: true,
			zIndex: 100,
			changeCallback: function(val) { },
			truncate: function(str) {return str;},
			scrollOptions: {}
		}, options);
		
		var $customSelect, $selectedValue, $selectValueWrap, $selectList, $dl, $options,
			_isOpen = false, 
			_isEnabled = true,
			_isFocused = false,
			_selectedValue = "";
		
		function init() {
			var selectId = "";
			if(typeof cfg.selectbox.attr("id") !== "undefined") {
				selectId = 'id="select-'+cfg.selectbox.attr("id")+'"';
			}
			cfg.selectbox.wrap('<div class="customSelect" '+selectId+' />');
			
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
			
			$customSelect.width(cfg.width);
			$dl.width(cfg.width - 2);

			_bindEvents();
			
			sb_manager.add(self);
		}
		
		/* >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
		 * start:private
		 * >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> */
		function _bindEvents() {
			$selectValueWrap.click(function() {
				if(_isOpen) {
					cfg.selectbox.focus();
					self.close();
				} else if(_isEnabled) {
					self.open();
				}
			});
			
			// delegated events
			$dl.click(function(e) {
				var $target = $(e.target);
				if($target.is("dd") || $target.parents("dd")) {
					if(e.target.tagName.toLowerCase() != "dd") {
						$target = $target.parents("dd");	
					}  
					if($target.get(0)) {
					self.jumpToIndex($target.get(0).className.split(" ")[0].split("-")[1]);
				
					self.close();
					cfg.selectbox.focus();
					}
				}				
			});
			
			cfg.selectbox.focus(function(e){
				_isFocused = true;
				$customSelect.addClass("focused");
			}).blur(function(e){
				_isFocused = false;
				$customSelect.removeClass("focused");
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
		
		function _bindHover() {
			var $dds = $(".customSelect dd");
			$dds.die("mouseover");
			$dds.die("mouseout");
			
			$dds.live("mouseover", function(e) {
				var $target = $(e.target);
				if(e.target.tagName.toLowerCase() != "dd") {
					$target = $target.parents("dd");
				}								   
				$target.addClass("hovered");														
			});

			$dds.live("mouseout", function(e) {
				var $target = $(e.target);
				if(e.target.tagName.toLowerCase() != "dd") {
					$target = $target.parents("dd");	
				}
				$target.removeClass("hovered");
			});
		}
		
		function _updateValue(val) {
			if($selectedValue.html() != val) {
				$selectedValue.html(_truncate(val));
				cfg.changeCallback(cfg.selectbox.val());
			}
		}
		
		function _renderOptions() {
			var optionHTML = [];
			
			$options.each(function(i, itm) {
				var $this = $(this);
				var optgroup = $this.parents('optgroup');
				if (optgroup.length > 0 && $this.prev().length === 0){
					optionHTML.push('<dt>'+optgroup.attr('label')+'</dt>');
				}

				var iconMarkup = "";
				if(itm.className != "") {
					$(itm.className.split(" ")).each(function() {
						iconMarkup += '<span class="' + this + '"></span>';
					});
				}

				if(itm.selected) {
					_selectedValue = iconMarkup + _truncate($(itm).html());
					optionHTML.push('<dd class="itm-'+i+' selected">' + iconMarkup + itm.innerHTML + '</dd>');
				} else {
					optionHTML.push('<dd class="itm-'+i+'">' + iconMarkup + itm.innerHTML + '</dd>');	
				}

			});
			
			if($selectedValue && $selectedValue.get(0) != null) {
				$selectedValue.html(_selectedValue);
			}
			
			return optionHTML.join("");	
		}
		
		function _setupScrollbar() {
			$dl.css("height","auto");
			if(cfg.height && $dl.height() > cfg.height) {
				$dl.css("height", cfg.height);
				if(cfg.customScrollbar) {
					self.scrollpane = $dl.jScrollPane($.extend({
						contentWidth: 200
					}, cfg.scrollOptions));					
				} else {
					$dl.addClass("defaultScrollbar");	
				}
			} else {
				$dl.css({overflow: "hidden"});	
			}	
		}
		
		function _truncate(str) {
			var arr = str.split("</span>");
			var valToTrunc = arr[arr.length - 1];
			arr[arr.length - 1] = "";
			var spans = arr.join("</SPAN>");

			return spans + cfg.truncate(valToTrunc);
		}
		// end:private
		
		/* >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
		 * start:public
		 * >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> */
			this.sync = function() {
				$options = cfg.selectbox.find("option");
				$dl.html(_renderOptions());
				$dl.jScrollPaneRemove();
				_bindHover();
				_setupScrollbar();
			};

			this.disable = function() {
				_isEnabled = false;
				$customSelect.addClass("disabled");
				cfg.selectbox.attr("disabled", "disabled");
			};
			
			this.enable = function() {
				_isEnabled = true;
				$customSelect.removeClass("disabled");
				cfg.selectbox.removeAttr("disabled");				
			};
			
			this.close = function() {
				$customSelect.removeClass("select-open");
				$customSelect.css({"z-index": cfg.zIndex});
				_isOpen = false;
			};
			
			this.open = function() {
				_setupScrollbar();
				if(cfg.manager) {
					cfg.manager.close();	
				}
				
				$customSelect.addClass("select-open");
				
				// TODO: figure out of this is still needed, it broke when upgrading dependencies
				if(self.scrollpane) { 
					// self.scrollpane[0].scrollTo($customSelect.find(".selected").position().top); 
				}
				
				$customSelect.css({"z-index": cfg.zIndex + 1});
				_isOpen = true;	
			};
			
			this.jumpToIndex = function(index) {
				cfg.selectbox.get(0).selectedIndex = index;
				$customSelect.find(".selected").removeClass("selected");
				$customSelect.find(".itm-" + index).addClass("selected");																			   
				_updateValue($customSelect.find(".itm-" + index).html());
			};
			
			this.jumpToValue = function(value) {
				var index = -1;
				
				$options.each(function(i){							   
					if (this.innerHTML==value){
						index = i;
						return false;
					}
				});

				if (index!=-1){
					self.jumpToIndex(index);
				}
				
				return index;
			};
		// end:public
		
		init();
	};
	
})(jQuery);