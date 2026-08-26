import React from "react";
import { IoChevronDownOutline } from "react-icons/io5";
import { AnimatePresence, motion } from "framer-motion";

const menuSpring = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1],
};

const labelMotion = {
  hidden: { opacity: 0, x: -6 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    x: -4,
    transition: { duration: 0.12, ease: [0.4, 0, 1, 1] },
  },
};

const MenuSection = ({ icon, title, isOpen, toggle, children, collapsed }) => {
  return (
    <motion.div transition={menuSpring} className="mb-2">
      {/* SECTION HEADER */}
      <motion.div
        title={collapsed ? title : ""}
        onClick={toggle}
        whileTap={{ scale: 0.98 }}
        transition={menuSpring}
        className={`flex items-center ${
          collapsed ? "justify-center px-2" : "justify-between px-4"
        } py-2 rounded-lg cursor-pointer text-gray-300 hover:bg-white/10 hover:text-blue-400 transition-all`}
      >
        <div className={`flex items-center ${collapsed ? "" : "gap-3"}`}>
          <span className="text-lg min-w-[20px]">{icon}</span>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                variants={labelMotion}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="whitespace-nowrap"
              >
                {title}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              variants={labelMotion}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex items-center"
            >
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center"
              >
                <IoChevronDownOutline />
              </motion.span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* CHILDREN with tree lines */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{
              height: menuSpring,
              opacity: { duration: 0.16 },
              y: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
            }}
            className={`${collapsed ? "mt-2 pl-4" : "pl-6 mt-2"} overflow-hidden list-none p-0 m-0 relative`}
          >
            {React.Children.map(children, (child, i) => {
              const total = React.Children.count(children);
              const isLast = i === total - 1;
              const isFirst = i === 0;

              return (
                <div className="relative">
                  {/* EXPANDED STATE - Tree structure */}
                  {!collapsed && (
                    <>
                      {/* Vertical line segment - full height for non-last items, half for last */}
                      <span
                        className={`absolute left-[-14px] top-0 w-[1.5px] bg-blue-400/20 pointer-events-none ${
                          isLast ? "h-1/2" : "h-full"
                        }`}
                      />
                      {/* Horizontal branch */}
                      <span className="absolute left-[-14px] top-1/2 w-[14px] h-[1.5px] bg-blue-400/20 pointer-events-none -translate-y-[0.75px]" />
                    </>
                  )}

                  {/* COLLAPSED STATE - Simpler vertical dots */}
                  {collapsed && (
                    <>
                      {/* Vertical line segment */}
                      <span
                        className={`absolute left-[-8px] top-0 w-[1.5px] bg-blue-400/20 pointer-events-none ${
                          isLast ? "h-1/2" : "h-full"
                        }`}
                      />
                      {/* Horizontal branch */}
                      <span className="absolute left-[-8px] top-1/2 w-[8px] h-[1.5px] bg-blue-400/20 pointer-events-none -translate-y-[0.75px]" />
                    </>
                  )}

                  {child}
                </div>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default React.memo(MenuSection);
